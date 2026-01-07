import type { Language } from '@shared/types'

export type I18nKey =
  | 'settings.title'
  | 'settings.search.placeholder'
  | 'settings.search.title'
  | 'settings.search.noResults'
  | 'settings.loading'
  | 'settings.loadFailed'
  | 'settings.noItems'

  | 'category.general'
  | 'category.autofill'
  | 'category.privacy'
  | 'category.performance'
  | 'category.appearance'
  | 'category.search'
  | 'category.startup'
  | 'category.language'
  | 'category.downloads'
  | 'category.accessibility'
  | 'category.system'
  | 'category.reset'
  | 'category.extensions'
  | 'category.defaultBrowser'
  | 'category.about'

  | 'theme.system'
  | 'theme.dark'
  | 'theme.light'

  | 'fontSize.small'
  | 'fontSize.medium'
  | 'fontSize.large'
  | 'fontSize.xlarge'

  | 'language.ko'
  | 'language.en'
  | 'language.ja'

  | 'action.reset'
  | 'action.refresh'
  | 'action.set'
  | 'action.open'

  | 'extensions.status.label'
  | 'extensions.status.desc'
  | 'extensions.status.loading'
  | 'extensions.status.loaded'
  | 'extensions.refresh.label'
  | 'extensions.refresh.desc'

  | 'defaultBrowser.status.label'
  | 'defaultBrowser.status.desc'
  | 'defaultBrowser.status.loading'
  | 'defaultBrowser.status.default'
  | 'defaultBrowser.status.notDefault'
  | 'defaultBrowser.status.format'
  | 'defaultBrowser.set.label'
  | 'defaultBrowser.set.desc'
  | 'defaultBrowser.openSystemSettings.label'
  | 'defaultBrowser.openSystemSettings.desc'

  | 'about.appName'
  | 'about.version'
  | 'about.userDataDir'
  | 'about.settingsPath'
  | 'about.loading'
  | 'about.path.userData.desc'
  | 'about.path.settings.desc'

  | 'item.savePasswords.label'
  | 'item.savePasswords.desc'
  | 'item.savePaymentInfo.label'
  | 'item.savePaymentInfo.desc'
  | 'item.saveAddresses.label'
  | 'item.saveAddresses.desc'
  | 'item.doNotTrack.label'
  | 'item.doNotTrack.desc'
  | 'item.blockThirdPartyCookies.label'
  | 'item.blockThirdPartyCookies.desc'
  | 'item.blockAds.label'
  | 'item.blockAds.desc'
  | 'item.pageZoom.label'
  | 'item.pageZoom.desc'
  | 'item.theme.label'
  | 'item.theme.desc'
  | 'item.showHomeButton.label'
  | 'item.showHomeButton.desc'
  | 'item.showBookmarksBar.label'
  | 'item.showBookmarksBar.desc'
  | 'item.fontSize.label'
  | 'item.fontSize.desc'
  | 'item.searchEngine.label'
  | 'item.searchEngine.desc'
  | 'item.downloadDirectory.label'
  | 'item.downloadDirectory.desc'
  | 'item.downloadAskWhereToSave.label'
  | 'item.downloadAskWhereToSave.desc'
  | 'item.downloadOpenAfterSave.label'
  | 'item.downloadOpenAfterSave.desc'
  | 'item.accessibilityHighContrast.label'
  | 'item.accessibilityHighContrast.desc'
  | 'item.accessibilityReduceMotion.label'
  | 'item.accessibilityReduceMotion.desc'
  | 'item.systemHardwareAcceleration.label'
  | 'item.systemHardwareAcceleration.desc'
  | 'item.systemBackgroundApps.label'
  | 'item.systemBackgroundApps.desc'
  | 'item.homepage.label'
  | 'item.homepage.desc'
  | 'item.continueSession.label'
  | 'item.continueSession.desc'
  | 'item.uiLanguage.label'
  | 'item.uiLanguage.desc'
  | 'item.resetAll.label'
  | 'item.resetAll.desc'
  | 'item.extensionsEnabled.label'
  | 'item.extensionsEnabled.desc'
  | 'item.extensionsDirectory.label'
  | 'item.extensionsDirectory.desc'
  | 'item.defaultBrowserPromptOnStartup.label'
  | 'item.defaultBrowserPromptOnStartup.desc'

export type Translator = (key: I18nKey, vars?: Record<string, string | number>) => string

const MESSAGES: Record<Language, Record<I18nKey, string>> = {
  ko: {
    'settings.title': '설정',
    'settings.search.placeholder': '설정 검색',
    'settings.search.title': '설정 검색',
    'settings.search.noResults': '검색 결과가 없습니다.',
    'settings.loading': '설정을 불러오는 중...',
    'settings.loadFailed': '설정을 불러오지 못했습니다.',
    'settings.noItems': '표시할 설정이 없습니다.',

    'category.general': '일반',
    'category.autofill': '자동 완성 및 비밀번호',
    'category.privacy': '개인정보 및 보안',
    'category.performance': '성능',
    'category.appearance': '모양',
    'category.search': '검색엔진',
    'category.startup': '시작 시 설정',
    'category.language': '언어',
    'category.downloads': '다운로드',
    'category.accessibility': '접근성',
    'category.system': '시스템',
    'category.reset': '설정 초기화',
    'category.extensions': '확장 프로그램',
    'category.defaultBrowser': '기본 브라우저',
    'category.about': 'Aside 정보',

    'theme.system': '시스템',
    'theme.dark': '다크',
    'theme.light': '라이트',

    'fontSize.small': '작게',
    'fontSize.medium': '보통',
    'fontSize.large': '크게',
    'fontSize.xlarge': '매우 크게',

    'language.ko': '한국어',
    'language.en': 'English',
    'language.ja': '日本語',

    'action.reset': '초기화',
    'action.refresh': '새로고침',
    'action.set': '설정',
    'action.open': '열기',

    'extensions.status.label': '로드 상태',
    'extensions.status.desc': '현재 로드된 확장 프로그램 상태입니다.',
    'extensions.status.loading': '불러오는 중...',
    'extensions.status.loaded': '{{count}}개 로드됨',
    'extensions.refresh.label': '확장 새로고침',
    'extensions.refresh.desc': '폴더를 다시 스캔하고 확장을 로드합니다.',

    'defaultBrowser.status.label': '현재 상태',
    'defaultBrowser.status.desc': 'OS에서 Aside가 기본 브라우저로 설정되어 있는지 확인합니다.',
    'defaultBrowser.status.loading': '불러오는 중...',
    'defaultBrowser.status.default': '기본',
    'defaultBrowser.status.notDefault': '아님',
    'defaultBrowser.status.format': 'HTTP: {{http}} / HTTPS: {{https}}',
    'defaultBrowser.set.label': '기본 브라우저로 설정',
    'defaultBrowser.set.desc': 'OS에 기본 브라우저 설정을 요청합니다.',
    'defaultBrowser.openSystemSettings.label': '시스템 설정 열기',
    'defaultBrowser.openSystemSettings.desc': '기본 앱 설정 화면을 엽니다.',

    'about.appName': '앱 이름',
    'about.version': '버전',
    'about.userDataDir': 'User Data 경로',
    'about.settingsPath': '설정 파일 경로',
    'about.loading': '불러오는 중...',
    'about.path.userData.desc': '앱 데이터가 저장되는 디렉토리입니다.',
    'about.path.settings.desc': 'electron-store 설정 파일 경로입니다.',

    'item.savePasswords.label': '비밀번호 저장',
    'item.savePasswords.desc': '웹사이트의 비밀번호 저장을 허용합니다.',
    'item.savePaymentInfo.label': '결제 수단 저장',
    'item.savePaymentInfo.desc': '결제 정보 자동완성을 허용합니다.',
    'item.saveAddresses.label': '주소 저장',
    'item.saveAddresses.desc': '주소 자동완성을 허용합니다.',
    'item.doNotTrack.label': '추적 방지(DNT) 요청',
    'item.doNotTrack.desc': '웹사이트에 추적 금지 요청을 보냅니다.',
    'item.blockThirdPartyCookies.label': '타사 쿠키 차단',
    'item.blockThirdPartyCookies.desc': '타사 쿠키를 차단합니다.',
    'item.blockAds.label': '광고 차단',
    'item.blockAds.desc': '기본 광고 차단 기능을 켭니다.',
    'item.pageZoom.label': '페이지 줌',
    'item.pageZoom.desc': '기본 페이지 줌을 설정합니다.',
    'item.theme.label': '테마',
    'item.theme.desc': '앱 테마를 선택합니다.',
    'item.showHomeButton.label': '홈 버튼 표시',
    'item.showHomeButton.desc': '상단 바에 홈 버튼을 표시합니다.',
    'item.showBookmarksBar.label': '북마크바 표시',
    'item.showBookmarksBar.desc': '북마크바를 표시합니다.',
    'item.fontSize.label': '글꼴 크기',
    'item.fontSize.desc': '기본 글꼴 크기를 선택합니다.',
    'item.searchEngine.label': '기본 검색엔진',
    'item.searchEngine.desc': '주소창 검색에 사용할 검색엔진을 선택합니다.',
    'item.downloadDirectory.label': '다운로드 위치',
    'item.downloadDirectory.desc': '다운로드 파일이 저장될 기본 폴더를 설정합니다. 비우면 시스템 기본값을 사용합니다.',
    'item.downloadAskWhereToSave.label': '저장할 위치를 매번 확인',
    'item.downloadAskWhereToSave.desc': '다운로드할 때마다 저장 위치를 선택합니다.',
    'item.downloadOpenAfterSave.label': '다운로드 후 자동 열기',
    'item.downloadOpenAfterSave.desc': '다운로드 완료 후 파일을 자동으로 열도록 시도합니다.',
    'item.accessibilityHighContrast.label': '고대비 모드',
    'item.accessibilityHighContrast.desc': 'UI 대비를 높여 가독성을 개선합니다.',
    'item.accessibilityReduceMotion.label': '동작 줄이기',
    'item.accessibilityReduceMotion.desc': '애니메이션/전환 효과를 최소화합니다.',
    'item.systemHardwareAcceleration.label': '하드웨어 가속 사용',
    'item.systemHardwareAcceleration.desc': '성능 향상을 위해 GPU 가속을 사용합니다(적용에 재시작이 필요할 수 있음).',
    'item.systemBackgroundApps.label': '백그라운드 앱 실행',
    'item.systemBackgroundApps.desc': '창을 닫은 후에도 백그라운드에서 일부 작업을 유지합니다.',
    'item.homepage.label': '홈페이지',
    'item.homepage.desc': '브라우저 시작 시 열릴 페이지를 설정합니다.',
    'item.continueSession.label': '세션 이어하기',
    'item.continueSession.desc': '다시 열 때 이전 세션을 복원합니다.',
    'item.uiLanguage.label': '언어',
    'item.uiLanguage.desc': 'UI 언어를 선택합니다.',
    'item.resetAll.label': '설정 초기화',
    'item.resetAll.desc': '모든 설정을 기본값으로 되돌립니다.',
    'item.extensionsEnabled.label': '확장 프로그램 사용',
    'item.extensionsEnabled.desc': '확장 프로그램 로드를 허용합니다.',
    'item.extensionsDirectory.label': '확장 프로그램 폴더',
    'item.extensionsDirectory.desc': '확장 프로그램을 로드할 디렉토리 경로입니다. 하위 폴더에 manifest.json이 있어야 합니다.',
    'item.defaultBrowserPromptOnStartup.label': '시작 시 기본 브라우저 안내',
    'item.defaultBrowserPromptOnStartup.desc': '시작할 때 기본 브라우저 여부를 안내합니다.',
  },
  en: {
    'settings.title': 'Settings',
    'settings.search.placeholder': 'Search settings',
    'settings.search.title': 'Search settings',
    'settings.search.noResults': 'No results found.',
    'settings.loading': 'Loading settings...',
    'settings.loadFailed': 'Failed to load settings.',
    'settings.noItems': 'No settings to show.',

    'category.general': 'General',
    'category.autofill': 'Autofill & Passwords',
    'category.privacy': 'Privacy & Security',
    'category.performance': 'Performance',
    'category.appearance': 'Appearance',
    'category.search': 'Search Engine',
    'category.startup': 'On Startup',
    'category.language': 'Language',
    'category.downloads': 'Downloads',
    'category.accessibility': 'Accessibility',
    'category.system': 'System',
    'category.reset': 'Reset',
    'category.extensions': 'Extensions',
    'category.defaultBrowser': 'Default Browser',
    'category.about': 'About Aside',

    'theme.system': 'System',
    'theme.dark': 'Dark',
    'theme.light': 'Light',

    'fontSize.small': 'Small',
    'fontSize.medium': 'Medium',
    'fontSize.large': 'Large',
    'fontSize.xlarge': 'Extra Large',

    'language.ko': 'Korean',
    'language.en': 'English',
    'language.ja': 'Japanese',

    'action.reset': 'Reset',
    'action.refresh': 'Refresh',
    'action.set': 'Set',
    'action.open': 'Open',

    'extensions.status.label': 'Load status',
    'extensions.status.desc': 'Shows currently loaded extensions.',
    'extensions.status.loading': 'Loading...',
    'extensions.status.loaded': '{{count}} loaded',
    'extensions.refresh.label': 'Reload extensions',
    'extensions.refresh.desc': 'Rescan the folder and load extensions.',

    'defaultBrowser.status.label': 'Current status',
    'defaultBrowser.status.desc': 'Checks whether Aside is set as the default browser in the OS.',
    'defaultBrowser.status.loading': 'Loading...',
    'defaultBrowser.status.default': 'Default',
    'defaultBrowser.status.notDefault': 'Not default',
    'defaultBrowser.status.format': 'HTTP: {{http}} / HTTPS: {{https}}',
    'defaultBrowser.set.label': 'Set as default browser',
    'defaultBrowser.set.desc': 'Requests the OS to set Aside as the default browser.',
    'defaultBrowser.openSystemSettings.label': 'Open system settings',
    'defaultBrowser.openSystemSettings.desc': 'Opens the default apps settings screen.',

    'about.appName': 'App name',
    'about.version': 'Version',
    'about.userDataDir': 'User data path',
    'about.settingsPath': 'Settings file path',
    'about.loading': 'Loading...',
    'about.path.userData.desc': 'Directory where app data is stored.',
    'about.path.settings.desc': 'Path to the electron-store settings file.',

    'item.savePasswords.label': 'Save passwords',
    'item.savePasswords.desc': 'Allows saving website passwords.',
    'item.savePaymentInfo.label': 'Save payment methods',
    'item.savePaymentInfo.desc': 'Allows autofill for payment information.',
    'item.saveAddresses.label': 'Save addresses',
    'item.saveAddresses.desc': 'Allows address autofill.',
    'item.doNotTrack.label': 'Send Do Not Track request',
    'item.doNotTrack.desc': 'Sends a Do Not Track request to websites.',
    'item.blockThirdPartyCookies.label': 'Block third-party cookies',
    'item.blockThirdPartyCookies.desc': 'Blocks third-party cookies.',
    'item.blockAds.label': 'Block ads',
    'item.blockAds.desc': 'Enables basic ad blocking.',
    'item.pageZoom.label': 'Page zoom',
    'item.pageZoom.desc': 'Sets the default page zoom.',
    'item.theme.label': 'Theme',
    'item.theme.desc': 'Selects the app theme.',
    'item.showHomeButton.label': 'Show home button',
    'item.showHomeButton.desc': 'Shows the home button in the top bar.',
    'item.showBookmarksBar.label': 'Show bookmarks bar',
    'item.showBookmarksBar.desc': 'Shows the bookmarks bar.',
    'item.fontSize.label': 'Font size',
    'item.fontSize.desc': 'Selects the default font size.',
    'item.searchEngine.label': 'Default search engine',
    'item.searchEngine.desc': 'Selects the search engine used for address bar searches.',
    'item.downloadDirectory.label': 'Download location',
    'item.downloadDirectory.desc': 'Sets the default download folder. Leave empty to use the system default.',
    'item.downloadAskWhereToSave.label': 'Always ask where to save',
    'item.downloadAskWhereToSave.desc': 'Choose where to save for each download.',
    'item.downloadOpenAfterSave.label': 'Open after download',
    'item.downloadOpenAfterSave.desc': 'Attempts to open files automatically after download completes.',
    'item.accessibilityHighContrast.label': 'High contrast mode',
    'item.accessibilityHighContrast.desc': 'Improves readability by increasing UI contrast.',
    'item.accessibilityReduceMotion.label': 'Reduce motion',
    'item.accessibilityReduceMotion.desc': 'Minimizes animations/transitions.',
    'item.systemHardwareAcceleration.label': 'Use hardware acceleration',
    'item.systemHardwareAcceleration.desc': 'Uses GPU acceleration for better performance (may require restart).',
    'item.systemBackgroundApps.label': 'Run background apps',
    'item.systemBackgroundApps.desc': 'Keeps some tasks running in the background after closing windows.',
    'item.homepage.label': 'Homepage',
    'item.homepage.desc': 'Sets the page that opens when the browser starts.',
    'item.continueSession.label': 'Continue where you left off',
    'item.continueSession.desc': 'Restores the previous session when reopening.',
    'item.uiLanguage.label': 'Language',
    'item.uiLanguage.desc': 'Selects the UI language.',
    'item.resetAll.label': 'Reset settings',
    'item.resetAll.desc': 'Resets all settings to defaults.',
    'item.extensionsEnabled.label': 'Enable extensions',
    'item.extensionsEnabled.desc': 'Allows loading extensions.',
    'item.extensionsDirectory.label': 'Extensions folder',
    'item.extensionsDirectory.desc': 'Directory to load extensions from. Each subfolder must include a manifest.json.',
    'item.defaultBrowserPromptOnStartup.label': 'Prompt on startup',
    'item.defaultBrowserPromptOnStartup.desc': 'Shows a prompt on startup about default browser status.',
  },
  ja: {
    'settings.title': '設定',
    'settings.search.placeholder': '設定を検索',
    'settings.search.title': '設定を検索',
    'settings.search.noResults': '結果がありません。',
    'settings.loading': '設定を読み込み中...',
    'settings.loadFailed': '設定の読み込みに失敗しました。',
    'settings.noItems': '表示する設定がありません。',

    'category.general': '一般',
    'category.autofill': '自動入力とパスワード',
    'category.privacy': 'プライバシーとセキュリティ',
    'category.performance': 'パフォーマンス',
    'category.appearance': '外観',
    'category.search': '検索エンジン',
    'category.startup': '起動時',
    'category.language': '言語',
    'category.downloads': 'ダウンロード',
    'category.accessibility': 'アクセシビリティ',
    'category.system': 'システム',
    'category.reset': 'リセット',
    'category.extensions': '拡張機能',
    'category.defaultBrowser': '既定のブラウザ',
    'category.about': 'Aside について',

    'theme.system': 'システム',
    'theme.dark': 'ダーク',
    'theme.light': 'ライト',

    'fontSize.small': '小',
    'fontSize.medium': '中',
    'fontSize.large': '大',
    'fontSize.xlarge': '特大',

    'language.ko': '韓国語',
    'language.en': '英語',
    'language.ja': '日本語',

    'action.reset': 'リセット',
    'action.refresh': '更新',
    'action.set': '設定',
    'action.open': '開く',

    'extensions.status.label': '読み込み状態',
    'extensions.status.desc': '現在読み込まれている拡張機能の状態です。',
    'extensions.status.loading': '読み込み中...',
    'extensions.status.loaded': '{{count}} 件読み込み済み',
    'extensions.refresh.label': '拡張機能を再読み込み',
    'extensions.refresh.desc': 'フォルダを再スキャンして拡張機能を読み込みます。',

    'defaultBrowser.status.label': '現在の状態',
    'defaultBrowser.status.desc': 'OSでAsideが既定のブラウザか確認します。',
    'defaultBrowser.status.loading': '読み込み中...',
    'defaultBrowser.status.default': '既定',
    'defaultBrowser.status.notDefault': '違います',
    'defaultBrowser.status.format': 'HTTP: {{http}} / HTTPS: {{https}}',
    'defaultBrowser.set.label': '既定のブラウザに設定',
    'defaultBrowser.set.desc': 'OSに既定ブラウザ設定を要求します。',
    'defaultBrowser.openSystemSettings.label': 'システム設定を開く',
    'defaultBrowser.openSystemSettings.desc': '既定のアプリ設定画面を開きます。',

    'about.appName': 'アプリ名',
    'about.version': 'バージョン',
    'about.userDataDir': 'User Data パス',
    'about.settingsPath': '設定ファイル パス',
    'about.loading': '読み込み中...',
    'about.path.userData.desc': 'アプリデータが保存されるディレクトリです。',
    'about.path.settings.desc': 'electron-store の設定ファイルパスです。',

    'item.savePasswords.label': 'パスワードを保存',
    'item.savePasswords.desc': 'Webサイトのパスワード保存を許可します。',
    'item.savePaymentInfo.label': '支払い方法を保存',
    'item.savePaymentInfo.desc': '支払い情報の自動入力を許可します。',
    'item.saveAddresses.label': '住所を保存',
    'item.saveAddresses.desc': '住所の自動入力を許可します。',
    'item.doNotTrack.label': 'DNT リクエスト',
    'item.doNotTrack.desc': 'Webサイトに追跡拒否リクエストを送信します。',
    'item.blockThirdPartyCookies.label': 'サードパーティCookieをブロック',
    'item.blockThirdPartyCookies.desc': 'サードパーティCookieをブロックします。',
    'item.blockAds.label': '広告をブロック',
    'item.blockAds.desc': '基本的な広告ブロック機能を有効にします。',
    'item.pageZoom.label': 'ページズーム',
    'item.pageZoom.desc': '既定のページズームを設定します。',
    'item.theme.label': 'テーマ',
    'item.theme.desc': 'アプリのテーマを選択します。',
    'item.showHomeButton.label': 'ホームボタンを表示',
    'item.showHomeButton.desc': '上部バーにホームボタンを表示します。',
    'item.showBookmarksBar.label': 'ブックマークバーを表示',
    'item.showBookmarksBar.desc': 'ブックマークバーを表示します。',
    'item.fontSize.label': 'フォントサイズ',
    'item.fontSize.desc': '既定のフォントサイズを選択します。',
    'item.searchEngine.label': '既定の検索エンジン',
    'item.searchEngine.desc': 'アドレスバー検索に使用する検索エンジンを選択します。',
    'item.downloadDirectory.label': 'ダウンロード先',
    'item.downloadDirectory.desc': '既定のダウンロードフォルダを設定します。空の場合はシステム既定を使用します。',
    'item.downloadAskWhereToSave.label': '毎回保存先を確認',
    'item.downloadAskWhereToSave.desc': 'ダウンロードごとに保存先を選択します。',
    'item.downloadOpenAfterSave.label': 'ダウンロード後に自動で開く',
    'item.downloadOpenAfterSave.desc': '完了後に自動で開くことを試みます。',
    'item.accessibilityHighContrast.label': '高コントラスト',
    'item.accessibilityHighContrast.desc': 'UIのコントラストを上げて読みやすくします。',
    'item.accessibilityReduceMotion.label': '動きを減らす',
    'item.accessibilityReduceMotion.desc': 'アニメーション/遷移効果を最小化します。',
    'item.systemHardwareAcceleration.label': 'ハードウェアアクセラレーション',
    'item.systemHardwareAcceleration.desc': 'GPUアクセラレーションを使用します(再起動が必要な場合があります)。',
    'item.systemBackgroundApps.label': 'バックグラウンド実行',
    'item.systemBackgroundApps.desc': 'ウィンドウを閉じても一部の作業を維持します。',
    'item.homepage.label': 'ホームページ',
    'item.homepage.desc': 'ブラウザ起動時に開くページを設定します。',
    'item.continueSession.label': 'セッションを復元',
    'item.continueSession.desc': '再度開いたとき前回のセッションを復元します。',
    'item.uiLanguage.label': '言語',
    'item.uiLanguage.desc': 'UIの言語を選択します。',
    'item.resetAll.label': '設定をリセット',
    'item.resetAll.desc': 'すべての設定を既定に戻します。',
    'item.extensionsEnabled.label': '拡張機能を有効化',
    'item.extensionsEnabled.desc': '拡張機能の読み込みを許可します。',
    'item.extensionsDirectory.label': '拡張機能フォルダ',
    'item.extensionsDirectory.desc': '拡張機能を読み込むディレクトリパスです。各サブフォルダに manifest.json が必要です。',
    'item.defaultBrowserPromptOnStartup.label': '起動時に案内',
    'item.defaultBrowserPromptOnStartup.desc': '起動時に既定ブラウザ状態を案内します。',
  },
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{\{(.*?)\}\}/g, (_match, rawKey) => {
    const key = String(rawKey).trim()
    const value = vars[key]
    return value === undefined ? '' : String(value)
  })
}

export function createTranslator(language: Language): Translator {
  const dict = MESSAGES[language] ?? MESSAGES.en
  return (key, vars) => {
    const template = dict[key] ?? MESSAGES.en[key] ?? key
    return interpolate(template, vars)
  }
}