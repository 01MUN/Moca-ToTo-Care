export interface FlutterFile {
  filename: string;
  path: string;
  language: string;
  code: string;
}

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  {
    filename: 'pubspec.yaml',
    path: 'pubspec.yaml',
    language: 'yaml',
    code: `name: moca_toto_care_flutter
description: "모카토토 케어 (Moca-ToTo Care) - 상용화 수준 반려동물 토탈 라이프케어 플러터 앱"
publish_to: 'none'
version: 1.2.0+3

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  cupertino_icons: ^1.0.8
  provider: ^6.1.2
  google_fonts: ^6.2.1
  flutter_animate: ^4.5.0
  percent_indicator: ^4.2.3
  intl: ^0.19.0
  shared_preferences: ^2.2.3
  
  # D-Day Local Push Notifications
  flutter_local_notifications: ^17.1.2
  timezone: ^0.9.3
  
  # Offline Caching & High Performance Local DB
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Geolocation & GPS Tracking
  geolocator: ^11.0.0
  http: ^1.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  hive_generator: ^2.0.1
  build_runner: ^2.4.9

flutter:
  uses-material-design: true
  assets:
    - assets/images/
`,
  },
  {
    filename: 'main.dart',
    path: 'lib/main.dart',
    language: 'dart',
    code: `import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'screens/home_screen.dart';
import 'screens/records_screen.dart';
import 'screens/walk_screen.dart';
import 'screens/community_screen.dart';
import 'providers/pet_provider.dart';
import 'services/notification_service.dart';
import 'services/offline_sync_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Local Push Notifications & Timezones
  await NotificationService().init();

  // Initialize Hive Offline Local Database
  await Hive.initFlutter();
  await OfflineSyncService().init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PetProvider()),
      ],
      child: const MocaTotoApp(),
    ),
  );
}

class MocaTotoApp extends StatelessWidget {
  const MocaTotoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '모카토토 케어',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF8B5E3C),
          primary: const Color(0xFF8B5E3C),
          secondary: const Color(0xFFD4A373),
          background: const Color(0xFFFDF8F0),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFFDF8F0),
        textTheme: GoogleFonts.notoSansKrTextTheme(),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    HomeScreen(),
    RecordsScreen(),
    WalkScreen(),
    CommunityScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFF8B5E3C),
          unselectedItemColor: const Color(0xFFA89F91),
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          unselectedLabelStyle: const TextStyle(fontSize: 12),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: '홈',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_today_outlined),
              activeIcon: Icon(Icons.calendar_today),
              label: '기록',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.directions_walk_outlined),
              activeIcon: Icon(Icons.directions_walk),
              label: '산책',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.place_outlined),
              activeIcon: Icon(Icons.place),
              label: '동네',
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },
  {
    filename: 'notification_service.dart',
    path: 'lib/services/notification_service.dart',
    language: 'dart',
    code: `import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    tz.initializeTimeZones();

    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notificationsPlugin.initialize(settings);
  }

  // Request user permission for notifications
  Future<bool> requestPermissions() async {
    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _notificationsPlugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    final bool? granted =
        await androidImplementation?.requestNotificationsPermission();
    return granted ?? true;
  }

  // Instant Test Notification
  Future<void> showInstantNotification({
    required String title,
    required String body,
  }) async {
    const NotificationDetails details = NotificationDetails(
      android: AndroidNotificationDetails(
        'moca_toto_channel',
        '모카토토 케어 알림',
        channelDescription: '반려동물 예방접종 및 투약 D-Day 알림',
        importance: Importance.max,
        priority: Priority.high,
      ),
      iOS: DarwinNotificationDetails(),
    );

    await _notificationsPlugin.show(0, title, body, details);
  }

  // Scheduled D-Day Notification for Heartworm or Vaccine
  Future<void> scheduleDDayNotification({
    required int id,
    required String petName,
    required String medicineName,
    required DateTime scheduledDate,
  }) async {
    await _notificationsPlugin.zonedSchedule(
      id,
      '🐾 $petName의 D-Day 투약 알림',
      '오늘은 $medicineName 복용 예정일입니다! 잊지 말고 챙겨주세요 💕',
      tz.TZDateTime.from(scheduledDate, tz.local),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'moca_dday_channel',
          'D-Day 백신 및 투약 알림',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }
}
`,
  },
  {
    filename: 'offline_sync_service.dart',
    path: 'lib/services/offline_sync_service.dart',
    language: 'dart',
    code: `import 'package:hive/hive.dart';

class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  late Box _walkBox;
  late Box _dailyBox;

  Future<void> init() async {
    _walkBox = await Hive.openBox('offline_walks');
    _dailyBox = await Hive.openBox('offline_daily_records');
  }

  // Save walk offline when network is disconnected
  Future<void> cacheWalkLocally(Map<String, dynamic> walkData) async {
    await _walkBox.add(walkData);
  }

  // Get cached walks
  List<Map<String, dynamic>> getCachedWalks() {
    return _walkBox.values.map((e) => Map<String, dynamic>.from(e)).toList();
  }

  // Clear synced items
  Future<void> clearSyncedWalks() async {
    await _walkBox.clear();
  }

  // Check pending sync count
  int get pendingSyncCount => _walkBox.length + _dailyBox.length;
}
`,
  },
  {
    filename: 'pet_provider.dart',
    path: 'lib/providers/pet_provider.dart',
    language: 'dart',
    code: `import 'package:flutter/foundation.dart';

class Pet {
  final String id;
  final String name;
  final String species;
  final String breed;
  final int age;
  final double weightKg;
  int happiness;
  int satiety;
  int energy;
  final String avatarUrl;

  Pet({
    required this.id,
    required this.name,
    required this.species,
    required this.breed,
    required this.age,
    required this.weightKg,
    required this.happiness,
    required this.satiety,
    required this.energy,
    required this.avatarUrl,
  });
}

class PetProvider extends ChangeNotifier {
  final List<Pet> _pets = [
    Pet(
      id: 'p1',
      name: '모카',
      species: 'dog',
      breed: '말티푸',
      age: 2,
      weightKg: 3.8,
      happiness: 92,
      satiety: 85,
      energy: 88,
      avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
    ),
    Pet(
      id: 'p2',
      name: '토토',
      species: 'dog',
      breed: '비숑 프리제',
      age: 1,
      weightKg: 4.5,
      happiness: 89,
      satiety: 70,
      energy: 95,
      avatarUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400',
    ),
  ];

  int _selectedPetIndex = 0;

  Pet get currentPet => _pets[_selectedPetIndex];
  List<Pet> get pets => _pets;

  void selectPet(int index) {
    _selectedPetIndex = index;
    notifyListeners();
  }

  void petTouch() {
    if (currentPet.happiness < 100) {
      currentPet.happiness = (currentPet.happiness + 2).clamp(0, 100);
      notifyListeners();
    }
  }

  void feedPet() {
    currentPet.satiety = (currentPet.satiety + 20).clamp(0, 100);
    currentPet.happiness = (currentPet.happiness + 5).clamp(0, 100);
    notifyListeners();
  }

  void playPet() {
    currentPet.energy = (currentPet.energy - 10).clamp(0, 100);
    currentPet.happiness = (currentPet.happiness + 15).clamp(0, 100);
    notifyListeners();
  }
}
`,
  },
  {
    filename: 'records_screen.dart',
    path: 'lib/screens/records_screen.dart',
    language: 'dart',
    code: `import 'package:flutter/material.dart';
import '../services/notification_service.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  final List<Map<String, dynamic>> _todoList = [
    {'title': '아침 유기농 사료 (45g)', 'time': '08:00', 'done': true},
    {'title': '유산균 1포 급여', 'time': '09:00', 'done': true},
    {'title': '저녁 사료 급여 (45g)', 'time': '19:00', 'done': false},
    {'title': '양치질 및 빗질하기', 'time': '21:00', 'done': false},
  ];

  void _triggerDDayPush() async {
    await NotificationService().showInstantNotification(
      title: '🐾 모카의 D-Day 투약 알림',
      body: '심장사상충 예방약(하트가드) 정기 복용일입니다! 잊지 말고 챙겨주세요 💊',
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🔔 D-Day 푸시 알림이 발송되었습니다!'),
          backgroundColor: Color(0xFF8B5E3C),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('오늘의 기록 & 돌봄 일지', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFFFDF8F0),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // D-Day Push Banner Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B5E3C), Color(0xFF6F472B)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.notifications_active, color: Colors.amberAccent, size: 28),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '심장사상충 복용 D-9',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text(
                        '매월 26일 정기 복용일 알림 등록됨',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: _triggerDDayPush,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF8B5E3C),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    minimumSize: Size.zero,
                  ),
                  child: const Text('테스트', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          const Text('오늘의 체크리스트', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ..._todoList.map((item) => Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: CheckboxListTile(
                  value: item['done'] as bool,
                  title: Text(
                    item['title'] as String,
                    style: TextStyle(
                      decoration: (item['done'] as bool) ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  subtitle: Text(item['time'] as String),
                  activeColor: const Color(0xFF8B5E3C),
                  onChanged: (val) {
                    setState(() {
                      item['done'] = val;
                    });
                  },
                ),
              )),
        ],
      ),
    );
  }
}
`,
  }
];
