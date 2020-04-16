export default { 

	//global
	nextLink:  ' DALEJ ',
	closeButton:  'ZAMKNIJ',
	connectButton:  'POŁĄCZ',
	sleepWell:  'Śpij dobrze!',
	settings:  'Ustawienia',
	vibration:  'Wibracja:',
	on:  'Włączona',
	off:  'Wyłączona',
	setDuration:  'Długość drzemki:',
	lightTherapy:  'Moduł Terapii światłem:',
	enabled:  'Aktywny',
	disabled:  'Nieaktywny',
	dismissSnooze:  'Odwołaj drzemkę',
	closeMenu:  'Zastosuj',
	disconnected:  'Rozłączono',
	reconnect:  'Połącz ponownie, aby kontynuować',
	close:  'Zamknij',
	dismiss:  'Odwołaj',
	statusConnecting:  'Łączenie...',
	btDisabled:  'Bluetooth wyłączony',
    btQuestion:  'Czy chcesz włączyć Bluetooth?',
    enableBT:  'Turn on Bluetooth',
    yes: 'TAK',
    no: 'NIE',
    hour:  ' godzinę',
    hours:  ' godzin',
    hours234:  ' godziny',
    minute:  ' minutę',
    minuteSnooze:  ' minuta',
    minutes:  ' minut',
    minutes234:  ' minuty',
    belowMinute:  'Alarm za mnniej niż minutę',
    alarmIn:  'Alarm za ',
    and:  ' i ',
    track:  'TRACK',
    tracking:  ' Tracking',
    offlineMode: 'Tryb Offline',
    snooze: 'Uśpij',
    illuminationTime: 'Czas naświetlania: ',

	//begin-landing.js
	welcomeSleepTracker:  'Witaj \n w aplikacji',
	tutorialDescription:  'Zadaniem tej aplikacji jest obudzić użytkownika w najbardziej optymalnej fazie snu bazując na pomiarach EEG.',

	//connector-01.js
	step1Title:  'Krok 1',
	musePowerOnWarning:  'Włącz opaskę Muse',
	museFirstGenWarning:  'Jeśli używasz opaskę pierwszej generacji, \n prawdopodobnie będziesz musiał \n sparować ją w ustawieniach bluetooth.',
	offlineInfo:  'Przejdź do trybu Offline',
	arduinoInfo:  'Jeśli chcesz użyć moduł Arduino, \n sparuj go w ustawieniach bluetooth \n zanim zaczniesz.',
	batteryOptimisation: 'Aby aplikacja działała poprawnie, wyłącz oszczędzanie energii.',
	offlineModeEnable:  'ODBLOKUJ TRYB OFFLINE',
	offlineModeDisable:  'ZABLOKUJ TRYB OFFLINE',
	connector2Link:  ' OK, JEST WŁĄCZONA ',

	//connector-02.js
	step2Title:  'Krok 2',
	getStartedLink:  'ZACZYNAMY ',
	waitMusePair:  'Poczekaj aż opaska połączy się \n z aplikacją Sleep Tracker...',
	proceed: 'Połączono! \n Przejdź dalej',

	//bt-module.js
	connectedTo:  'Połączono z:',
	notConnected:  'Nie połączono',
	done:  'Gotowe',
	devicesList:  'Wyświetl listę sparowanych urządzeń',
	btList:  'Sparowane urządzenia:',
	alreadyConnected:  'Już połączono.',
	unableToConnect:  'Nie można połączyć z tym urządzeniem.',
	testButton:  'Test LED',
	setLightIntensity:  'Intensywność światła:',

	//nap-night-tracker.js
	sleepTrackerTitle:  'MONITOR SNU',
	napTitle:  'DRZEMKA',
	toShort:  'Ustaw alarm dłuższy niż godzina',
	pressTrack:  'Naciśnij przycisk TRACK, aby zacząć',
	setTime:  'Ustaw alarm i naciśnij przycisk TRACK',
	wakeTime:  'Oczekiwany czas pobudki:',

	//sandbox.js
	sandboxCardTitle:  'SANDBOX',
	descriptionOne:  'Jednokanałowe EEG - wyświetla nieprzetworzony sygnał z jednej elektrody',
	lowPass:  '< 35hz dolno-pasmowy',
	highPass:  '> 2hz górno-pasmowy',
	bandPass:  '2-35hz środkowo-pasmowy',
	low:  'DOLNY',
	high:  'GÓRNY',
	band:  'ŚRODKOWY',
	descriptionTwo:  'Krzywa PSD reprezentuje natężenie poszczególnych częstotliwości EEG',
	raw:  'SUROWY',
	filtered:  'FILTR',
	psd:  'PSD',

	//info.js / info-offline.js
	infoTitle:  'INFO i NARZĘDZIA',
	offlineInfoTitle:  'INFO OFFLINE',
	recordEEG:  'Nagraj EEG',
	recording:  ' Nagrywanie',
    infoOne: 'Suhe gacie na dnie moża',
    infoTwo: 'Will be some info2',
    infoThree: 'Will be some info3',
    infoFour: 'Will be some info4',
    infoFive: 'Will be some info5',
    infoSix: 'Will be some info6',

	//light-therapy-offline.js
	alarmClock:  'ALARM',
	setAlarm:  'Ustaw alarm',
	connectArduino:  'Połącz z Arduino i ustaw alarm',
	toShortAlarm:  'Ustaw alarm dłuższy niż ',
	setButton:  'Włącz',

	//charts.js
	chartsTitle:  'WYKRESY',
	showChart:  'Widok poziomy',

	//DeviceStatusWdiget
	widgetConnected:  'Połączono',
	widgetDisconnected:  'Nie połączono',

	//ConnectorModule/component.js
	permissions:  'Ta aplikacja wymaga dostępu do lokalizacji, aby poprawnie połaczyć się z Muse 2016 oraz dostępu do pamięci aby móc zapisywać dane do pliku .csv',
	statusConnected:  'Połączono',
	statusNoMusesTitle:  'Nie znaleziono Muse.',
	searchAgain:  ' PONÓW SZUKANIE ',
	search:  ' SZUKAJ ',
	statusDisconnected:  'Szukam Muse',
	noMuse:  'Nie połączono',
	btInfo:  'Bluetooth wydaje się być wyłączony!',	
	searching:  'Szukam...',
	availableMuses: 'Dostępne urządzenia',

	//SideMenu.js
	sleepTitle:  'Sleep Tracker', 
	sleepTrckr:  'Monitor snu',
	napTrckr:  'Drzemka',
	infoScene:  'Info i Narzędzia',
	infoSceneOffline:  'Info',
	sandboxTitle:  'Rejestrator EEG',
	eegSandbox:  'Rejestrator EEG',
	offlineTitle:  'Terapia Światłem',
	alarmTitle:  'Alarm',
	charts:  'Wykresy', 

	//LineNoisePicker.js
	notchFrequency:  'Filtr',
};