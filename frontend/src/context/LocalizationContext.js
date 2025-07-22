import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Translation strings
const translations = {
  en: {
    user: 'User',
    editProfile: 'Edit Profile',
    memberSince: 'Member since {{year}}',
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    arabic: 'Arabic',
    signOutTitle: 'Sign Out',
    signOutConfirm: 'Are you sure you want to sign out?',
    signOut: 'Sign Out',
    deleteAccountTitle: 'Delete Account',
    deleteAccountWarning: 'This action cannot be undone. All your data will be permanently deleted.',
    confirmDeletionTitle: 'Confirm Deletion',
    confirmDeletionPrompt: 'Type "DELETE" to confirm account deletion',
    confirm: 'Confirm',
    failedToDeleteAccount: 'Failed to delete account',
    failedToUpdateSettings: 'Failed to update settings',
    medicationReminders: 'Medication Reminders',
    getNotifiedAboutMedicationTimes: 'Get notified about medication times',
    healthCheckins: 'Health Check-ins',
    dailyHealthCheckinReminders: 'Daily health check-in reminders',
    emergencyAlerts: 'Emergency Alerts',
    criticalEmergencyNotifications: 'Critical emergency notifications',
    brainTraining: 'Brain Training',
    dailyBrainTrainingReminders: 'Daily brain training reminders',
    adjustTextSize: 'Adjust text size for better readability',
    themeAccessibility: 'Theme Accessibility',
    allColorsMeetAccessibility: '✅ All colors meet accessibility standards',
    contrastIssuesFound: '⚠️ {{count}} contrast issues found',
    highContrast: 'High Contrast',
    increaseColorContrast: 'Increase color contrast for better visibility',
    switchTheme: 'Switch between light and dark theme',
    previewThemes: 'Preview Themes',
    seeThemePreview: 'See how themes look with different UI elements',
    voiceAssistant: 'Voice Assistant',
    enableVoiceCommands: 'Enable voice commands and responses',
    hapticFeedback: 'Haptic Feedback',
    vibrationFeedback: 'Vibration feedback for interactions',
    privacyAndData: 'Privacy & Data',
    shareHealthData: 'Share Health Data',
    shareAnonymizedHealthData: 'Share anonymized health data for research',
    locationTracking: 'Location Tracking',
    allowLocationTracking: 'Allow location tracking for emergency features',
    manageSafeZones: 'Manage Safe Zones',
    configureGeofencedAreas: 'Configure geofenced areas for location monitoring',
    analytics: 'Analytics',
    helpImproveWithAnalytics: 'Help improve the app with usage analytics',
    viewPrivacyPolicy: 'View Privacy Policy',
    privacyPolicy: 'Privacy Policy',
    privacyPolicyComingSoon: 'Privacy policy feature coming soon!',
    general: 'General',
    supportAndInfo: 'Support & Information',
    helpFaq: 'Help & FAQ',
    getHelpAndAnswers: 'Get help and find answers',
    help: 'Help',
    helpSectionComingSoon: 'Help section coming soon!',
    contactSupport: 'Contact Support',
    getInTouchSupport: 'Get in touch with our support team',
    supportContactComingSoon: 'Support contact feature coming soon!',
    about: 'About',
    appVersionInfo: 'App version and information',
    aboutSectionComingSoon: 'About section coming soon!',
    account: 'Account',
    exportData: 'Export Data',
    dataExportComingSoon: 'Data export feature coming soon!',
    exportMyData: 'Export My Data',
    deleteAccount: 'Delete Account',
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    
    // Navigation
    home: 'Home',
    health: 'Health',
    medications: 'Medications',
    emergency: 'Emergency',
    settings: 'Settings',
    dashboard: 'Dashboard',
    
    // Auth
    email: 'Email',
    password: 'Password',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    forgotPassword: 'Forgot Password',
    resetPassword: 'Reset Password',
    backToLogin: 'Back to Login',
    pleaseEnterEmail: 'Please enter your email address',
    pleaseEnterValidEmail: 'Please enter a valid email address',
    passwordResetEmailSent: 'Password reset email sent successfully',
    passwordResetEmailSentDescription: 'Check your email for instructions to reset your password',
    enterEmailForPasswordReset: 'Enter your email address to receive password reset instructions',
    sendResetEmail: 'Send Reset Email',
    failedToSendEmail: 'Failed to send reset email',
    emailNotFound: 'Email address not found',
    networkError: 'Network error. Please check your connection and try again.',
    
    // Settings
    notifications: 'Notifications',
    accessibility: 'Accessibility',
    privacy: 'Privacy',
    general: 'General',
    language: 'Language',
    timeFormat: 'Time Format',
    fontSize: 'Font Size',
    darkMode: 'Dark Mode',
    
    // Time
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    
    // Days of week
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    
    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
    
    // Health
    mood: 'Mood',
    energy: 'Energy',
    wellnessStatus: 'Wellness Status',
    healthCheckin: 'Health Check-in',
    
    // Medications
    takeMedication: 'Take Medication',
    medicationReminder: 'Medication Reminder',
    upcoming: 'upcoming',
    
    // Emergency
    emergency: 'Emergency',
    emergencyContact: 'Emergency Contact',
    callEmergency: 'Call Emergency',
    
    // Font sizes
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    extraLarge: 'Extra Large',
    
    // Additional UI text
    hours: 'hours',
    preview: 'Preview',
    currentTime: 'Current time',
    appLanguage: 'App language',
    '12hourOr24hour': '12-hour or 24-hour format',
    
    // UI Demo/Preview
    sampleHeading: 'Sample Heading',
    bodyTextPreview: 'This is how body text will appear in the app.',
    fontSizePreview: 'You can use this preview to see how readable the text is at different sizes.',
    lightThemeSample: 'Light Theme Sample',
    darkThemeSample: 'Dark Theme Sample',
  },
  
  es: {
    user: 'Usuario',
    editProfile: 'Editar Perfil',
    memberSince: 'Miembro desde {{year}}',
    english: 'Inglés',
    spanish: 'Español',
    french: 'Francés',
    arabic: 'Árabe',
    signOutTitle: 'Cerrar Sesión',
    signOutConfirm: '¿Está seguro de que desea cerrar sesión?',
    signOut: 'Cerrar Sesión',
    deleteAccountTitle: 'Eliminar Cuenta',
    deleteAccountWarning: 'Esta acción no se puede deshacer. Todos sus datos se eliminarán permanentemente.',
    confirmDeletionTitle: 'Confirmar Eliminación',
    confirmDeletionPrompt: 'Escriba "DELETE" para confirmar la eliminación de la cuenta',
    confirm: 'Confirmar',
    failedToDeleteAccount: 'No se pudo eliminar la cuenta',
    failedToUpdateSettings: 'No se pudo actualizar la configuración',
    medicationReminders: 'Recordatorios de Medicamentos',
    getNotifiedAboutMedicationTimes: 'Reciba notificaciones sobre los horarios de los medicamentos',
    healthCheckins: 'Chequeos de Salud',
    dailyHealthCheckinReminders: 'Recordatorios diarios de chequeo de salud',
    emergencyAlerts: 'Alertas de Emergencia',
    criticalEmergencyNotifications: 'Notificaciones críticas de emergencia',
    brainTraining: 'Entrenamiento Cerebral',
    dailyBrainTrainingReminders: 'Recordatorios diarios de entrenamiento cerebral',
    adjustTextSize: 'Ajuste el tamaño del texto para una mejor legibilidad',
    themeAccessibility: 'Accesibilidad del Tema',
    allColorsMeetAccessibility: '✅ Todos los colores cumplen con los estándares de accesibilidad',
    contrastIssuesFound: '⚠️ {{count}} problemas de contraste encontrados',
    highContrast: 'Alto Contraste',
    increaseColorContrast: 'Aumentar el contraste de color para una mejor visibilidad',
    switchTheme: 'Cambiar entre tema claro y oscuro',
    previewThemes: 'Vista Previa de Temas',
    seeThemePreview: 'Vea cómo se ven los temas con diferentes elementos de la interfaz',
    voiceAssistant: 'Asistente de Voz',
    enableVoiceCommands: 'Habilitar comandos y respuestas de voz',
    hapticFeedback: 'Retroalimentación Háptica',
    vibrationFeedback: 'Vibración para interacciones',
    privacyAndData: 'Privacidad y Datos',
    shareHealthData: 'Compartir Datos de Salud',
    shareAnonymizedHealthData: 'Compartir datos de salud anonimizados para investigación',
    locationTracking: 'Seguimiento de Ubicación',
    allowLocationTracking: 'Permitir el seguimiento de ubicación para funciones de emergencia',
    manageSafeZones: 'Gestionar Zonas Seguras',
    configureGeofencedAreas: 'Configurar áreas geovalladas para el monitoreo de ubicación',
    analytics: 'Analytica',
    helpImproveWithAnalytics: 'Ayude a mejorar la aplicación con analítica de uso',
    viewPrivacyPolicy: 'Ver Política de Privacidad',
    privacyPolicy: 'Política de Privacidad',
    privacyPolicyComingSoon: '¡La función de política de privacidad estará disponible pronto!',
    general: 'General',
    supportAndInfo: 'Soporte e Información',
    helpFaq: 'Ayuda y Preguntas Frecuentes',
    getHelpAndAnswers: 'Obtenga ayuda y encuentre respuestas',
    help: 'Ayuda',
    helpSectionComingSoon: '¡La sección de ayuda estará disponible pronto!',
    contactSupport: 'Contactar Soporte',
    getInTouchSupport: 'Póngase en contacto con nuestro equipo de soporte',
    supportContactComingSoon: '¡La función de contacto de soporte estará disponible pronto!',
    about: 'Acerca de',
    appVersionInfo: 'Versión e información de la aplicación',
    aboutSectionComingSoon: '¡La sección Acerca de estará disponible pronto!',
    account: 'Cuenta',
    exportData: 'Exportar Datos',
    dataExportComingSoon: '¡La función de exportación de datos estará disponible pronto!',
    exportMyData: 'Exportar Mis Datos',
    deleteAccount: 'Eliminar Cuenta',
    // Common
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    
    // Navigation
    home: 'Inicio',
    health: 'Salud',
    medications: 'Medicamentos',
    emergency: 'Emergencia',
    settings: 'Configuración',
    dashboard: 'Panel',
    
    // Auth
    email: 'Correo Electrónico',
    password: 'Contraseña',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    logout: 'Cerrar Sesión',
    forgotPassword: 'Olvidé mi Contraseña',
    resetPassword: 'Restablecer Contraseña',
    backToLogin: 'Volver al Inicio de Sesión',
    pleaseEnterEmail: 'Por favor ingrese su dirección de correo electrónico',
    pleaseEnterValidEmail: 'Por favor ingrese una dirección de correo electrónico válida',
    passwordResetEmailSent: 'Correo de restablecimiento de contraseña enviado exitosamente',
    passwordResetEmailSentDescription: 'Revise su correo electrónico para obtener instrucciones para restablecer su contraseña',
    enterEmailForPasswordReset: 'Ingrese su dirección de correo electrónico para recibir instrucciones de restablecimiento de contraseña',
    sendResetEmail: 'Enviar Correo de Restablecimiento',
    failedToSendEmail: 'No se pudo enviar el correo de restablecimiento',
    emailNotFound: 'Dirección de correo electrónico no encontrada',
    networkError: 'Error de red. Por favor verifique su conexión e intente nuevamente.',
    
    // Settings
    notifications: 'Notificaciones',
    accessibility: 'Accesibilidad',
    privacy: 'Privacidad',
    general: 'General',
    language: 'Idioma',
    timeFormat: 'Formato de Hora',
    fontSize: 'Tamaño de Fuente',
    darkMode: 'Modo Oscuro',
    
    // Time
    morning: 'Buenos Días',
    afternoon: 'Buenas Tardes',
    evening: 'Buenas Noches',
    
    // Days of week
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    
    // Months
    january: 'Enero',
    february: 'Febrero',
    march: 'Marzo',
    april: 'Abril',
    may: 'Mayo',
    june: 'Junio',
    july: 'Julio',
    august: 'Agosto',
    september: 'Septiembre',
    october: 'Octubre',
    november: 'Noviembre',
    december: 'Diciembre',
    
    // Health
    mood: 'Estado de Ánimo',
    energy: 'Energía',
    wellnessStatus: 'Estado de Bienestar',
    healthCheckin: 'Chequeo de Salud',
    
    // Medications
    takeMedication: 'Tomar Medicamento',
    medicationReminder: 'Recordatorio de Medicamento',
    upcoming: 'próximos',
    
    // Emergency
    emergency: 'Emergencia',
    emergencyContact: 'Contacto de Emergencia',
    callEmergency: 'Llamar Emergencia',
    
    // Font sizes
    small: 'Pequeño',
    medium: 'Mediano',
    large: 'Grande',
    extraLarge: 'Extra Grande',
    
    // Additional UI text
    hours: 'horas',
    preview: 'Vista previa',
    currentTime: 'Hora actual',
    appLanguage: 'Idioma de la aplicación',
    '12hourOr24hour': 'Formato de 12 o 24 horas',
    
    // UI Demo/Preview
    sampleHeading: 'Encabezado de ejemplo',
    bodyTextPreview: 'Así es como aparecerá el texto del cuerpo en la aplicación.',
    fontSizePreview: 'Puede usar esta vista previa para ver la legibilidad del texto en diferentes tamaños.',
    lightThemeSample: 'Ejemplo de tema claro',
    darkThemeSample: 'Ejemplo de tema oscuro',
  },
  
  fr: {
    user: 'Utilisateur',
    editProfile: 'Modifier le Profil',
    memberSince: 'Membre depuis {{year}}',
    english: 'Anglais',
    spanish: 'Espagnol',
    french: 'Français',
    arabic: 'Arabe',
    signOutTitle: 'Déconnexion',
    signOutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    signOut: 'Déconnexion',
    deleteAccountTitle: 'Supprimer le Compte',
    deleteAccountWarning: 'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
    confirmDeletionTitle: 'Confirmer la Suppression',
    confirmDeletionPrompt: 'Tapez "DELETE" pour confirmer la suppression du compte',
    confirm: 'Confirmer',
    failedToDeleteAccount: 'Échec de la suppression du compte',
    failedToUpdateSettings: 'Échec de la mise à jour des paramètres',
    medicationReminders: 'Rappels de Médicaments',
    getNotifiedAboutMedicationTimes: 'Recevez des notifications sur les horaires des médicaments',
    healthCheckins: 'Bilans de Santé',
    dailyHealthCheckinReminders: 'Rappels quotidiens de bilan de santé',
    emergencyAlerts: 'Alertes d’Urgence',
    criticalEmergencyNotifications: 'Notifications d’urgence critiques',
    brainTraining: 'Entraînement Cérébral',
    dailyBrainTrainingReminders: 'Rappels quotidiens d’entraînement cérébral',
    adjustTextSize: 'Ajustez la taille du texte pour une meilleure lisibilité',
    themeAccessibility: 'Accessibilité du Thème',
    allColorsMeetAccessibility: '✅ Toutes les couleurs respectent les normes d’accessibilité',
    contrastIssuesFound: '⚠️ {{count}} problèmes de contraste trouvés',
    highContrast: 'Contraste Élevé',
    increaseColorContrast: 'Augmenter le contraste des couleurs pour une meilleure visibilité',
    switchTheme: 'Basculer entre le thème clair et sombre',
    previewThemes: 'Aperçu des Thèmes',
    seeThemePreview: 'Voir l’aperçu des thèmes avec différents éléments UI',
    voiceAssistant: 'Assistant Vocal',
    enableVoiceCommands: 'Activer les commandes et réponses vocales',
    hapticFeedback: 'Retour Haptique',
    vibrationFeedback: 'Vibration pour les interactions',
    privacyAndData: 'Confidentialité & Données',
    shareHealthData: 'Partager les Données de Santé',
    shareAnonymizedHealthData: 'Partager des données de santé anonymisées pour la recherche',
    locationTracking: 'Suivi de Localisation',
    allowLocationTracking: 'Autoriser le suivi de localisation pour les fonctions d’urgence',
    manageSafeZones: 'Gérer les Zones de Sécurité',
    configureGeofencedAreas: 'Configurer des zones géolocalisées pour la surveillance',
    analytics: 'Analytique',
    helpImproveWithAnalytics: 'Aidez à améliorer l’application avec l’analytique d’utilisation',
    viewPrivacyPolicy: 'Voir la Politique de Confidentialité',
    privacyPolicy: 'Politique de Confidentialité',
    privacyPolicyComingSoon: 'Fonctionnalité de politique de confidentialité à venir !',
    general: 'Général',
    supportAndInfo: 'Support & Informations',
    helpFaq: 'Aide & FAQ',
    getHelpAndAnswers: 'Obtenez de l’aide et trouvez des réponses',
    help: 'Aide',
    helpSectionComingSoon: 'Section d’aide à venir !',
    contactSupport: 'Contacter le Support',
    getInTouchSupport: 'Contactez notre équipe de support',
    supportContactComingSoon: 'Fonction de contact du support à venir !',
    about: 'À propos',
    appVersionInfo: 'Version et informations de l’application',
    aboutSectionComingSoon: 'Section À propos à venir !',
    account: 'Compte',
    exportData: 'Exporter les Données',
    dataExportComingSoon: 'Fonction d’exportation de données à venir !',
    exportMyData: 'Exporter Mes Données',
    deleteAccount: 'Supprimer le Compte',
    // Common
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    
    // Navigation
    home: 'Accueil',
    health: 'Santé',
    medications: 'Médicaments',
    emergency: 'Urgence',
    settings: 'Paramètres',
    dashboard: 'Tableau de Bord',
    
    // Settings
    notifications: 'Notifications',
    accessibility: 'Accessibilité',
    privacy: 'Confidentialité',
    general: 'Général',
    language: 'Langue',
    timeFormat: 'Format de l\'Heure',
    fontSize: 'Taille de Police',
    darkMode: 'Mode Sombre',
    
    // Time
    morning: 'Bonjour',
    afternoon: 'Bon Après-midi',
    evening: 'Bonsoir',
    
    // Days of week
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
    
    // Months
    january: 'Janvier',
    february: 'Février',
    march: 'Mars',
    april: 'Avril',
    may: 'Mai',
    june: 'Juin',
    july: 'Juillet',
    august: 'Août',
    september: 'Septembre',
    october: 'Octobre',
    november: 'Novembre',
    december: 'Décembre',
    
    // Health
    mood: 'Humeur',
    energy: 'Énergie',
    wellnessStatus: 'État de Bien-être',
    healthCheckin: 'Bilan de Santé',
    
    // Medications
    takeMedication: 'Prendre un Médicament',
    medicationReminder: 'Rappel de Médicament',
    upcoming: 'à venir',
    
    // Emergency
    emergency: 'Urgence',
    emergencyContact: 'Contact d\'Urgence',
    callEmergency: 'Appeler les Urgences',
    
    // Font sizes
    small: 'Petit',
    medium: 'Moyen',
    large: 'Grand',
    extraLarge: 'Très Grand',
    
    // Additional UI text
    hours: 'heures',
    preview: 'Aperçu',
    currentTime: 'Heure actuelle',
    appLanguage: 'Langue de l\'application',
    '12hourOr24hour': 'Format 12 ou 24 heures',
    
    // UI Demo/Preview
    sampleHeading: 'Exemple de Titre',
    bodyTextPreview: 'Voici comment le texte du corps apparaîtra dans l’application.',
    fontSizePreview: 'Utilisez cet aperçu pour voir la lisibilité du texte à différentes tailles.',
    lightThemeSample: 'Exemple de thème clair',
    darkThemeSample: 'Exemple de thème sombre',
  },
  
  ar: {
    user: 'مستخدم',
    editProfile: 'تعديل الملف الشخصي',
    memberSince: 'عضو منذ {{year}}',
    english: 'الإنجليزية',
    spanish: 'الإسبانية',
    french: 'الفرنسية',
    arabic: 'العربية',
    signOutTitle: 'تسجيل الخروج',
    signOutConfirm: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    signOut: 'تسجيل الخروج',
    deleteAccountTitle: 'حذف الحساب',
    deleteAccountWarning: 'لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع بياناتك نهائيًا.',
    confirmDeletionTitle: 'تأكيد الحذف',
    confirmDeletionPrompt: 'اكتب "DELETE" لتأكيد حذف الحساب',
    confirm: 'تأكيد',
    failedToDeleteAccount: 'فشل في حذف الحساب',
    failedToUpdateSettings: 'فشل في تحديث الإعدادات',
    medicationReminders: 'تذكيرات الدواء',
    getNotifiedAboutMedicationTimes: 'تلقي إشعارات حول مواعيد الدواء',
    healthCheckins: 'فحوصات الصحة',
    dailyHealthCheckinReminders: 'تذكيرات يومية بفحص الصحة',
    emergencyAlerts: 'تنبيهات الطوارئ',
    criticalEmergencyNotifications: 'إشعارات الطوارئ الحرجة',
    brainTraining: 'تدريب الدماغ',
    dailyBrainTrainingReminders: 'تذكيرات تدريب الدماغ اليومية',
    adjustTextSize: 'ضبط حجم النص لتحسين القراءة',
    themeAccessibility: 'إمكانية وصول السمة',
    allColorsMeetAccessibility: '✅ جميع الألوان تلبي معايير الوصول',
    contrastIssuesFound: '⚠️ تم العثور على {{count}} مشكلة تباين',
    highContrast: 'تباين عالي',
    increaseColorContrast: 'زيادة تباين الألوان لتحسين الرؤية',
    switchTheme: 'التبديل بين الوضع الفاتح والداكن',
    previewThemes: 'معاينة السمات',
    seeThemePreview: 'شاهد كيف تبدو السمات مع عناصر واجهة المستخدم المختلفة',
    voiceAssistant: 'مساعد صوتي',
    enableVoiceCommands: 'تمكين الأوامر والاستجابات الصوتية',
    hapticFeedback: 'ردود الفعل اللمسية',
    vibrationFeedback: 'اهتزاز للتفاعلات',
    privacyAndData: 'الخصوصية والبيانات',
    shareHealthData: 'مشاركة بيانات الصحة',
    shareAnonymizedHealthData: 'مشاركة بيانات صحية مجهولة للبحث',
    locationTracking: 'تتبع الموقع',
    allowLocationTracking: 'السماح بتتبع الموقع لميزات الطوارئ',
    manageSafeZones: 'إدارة المناطق الآمنة',
    configureGeofencedAreas: 'تكوين المناطق الجغرافية للمراقبة',
    analytics: 'التحليلات',
    helpImproveWithAnalytics: 'ساعد في تحسين التطبيق من خلال تحليلات الاستخدام',
    viewPrivacyPolicy: 'عرض سياسة الخصوصية',
    privacyPolicy: 'سياسة الخصوصية',
    privacyPolicyComingSoon: 'ميزة سياسة الخصوصية قادمة قريبًا!',
    general: 'عام',
    supportAndInfo: 'الدعم والمعلومات',
    helpFaq: 'المساعدة والأسئلة الشائعة',
    getHelpAndAnswers: 'احصل على المساعدة وابحث عن الإجابات',
    help: 'مساعدة',
    helpSectionComingSoon: 'قسم المساعدة قادم قريبًا!',
    contactSupport: 'الاتصال بالدعم',
    getInTouchSupport: 'تواصل مع فريق الدعم لدينا',
    supportContactComingSoon: 'ميزة الاتصال بالدعم قادمة قريبًا!',
    about: 'حول',
    appVersionInfo: 'إصدار التطبيق والمعلومات',
    aboutSectionComingSoon: 'قسم حول قادم قريبًا!',
    account: 'الحساب',
    exportData: 'تصدير البيانات',
    dataExportComingSoon: 'ميزة تصدير البيانات قادمة قريبًا!',
    exportMyData: 'تصدير بياناتي',
    deleteAccount: 'حذف الحساب',
    // Common
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة',
    yes: 'نعم',
    no: 'لا',
    ok: 'موافق',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    
    // Navigation
    home: 'الرئيسية',
    health: 'الصحة',
    medications: 'الأدوية',
    emergency: 'الطوارئ',
    settings: 'الإعدادات',
    dashboard: 'لوحة التحكم',
    
    // Settings
    notifications: 'الإشعارات',
    accessibility: 'إمكانية الوصول',
    privacy: 'الخصوصية',
    general: 'عام',
    language: 'اللغة',
    timeFormat: 'تنسيق الوقت',
    fontSize: 'حجم الخط',
    darkMode: 'الوضع المظلم',
    
    // Time
    morning: 'صباح الخير',
    afternoon: 'مساء الخير',
    evening: 'مساء الخير',
    
    // Days of week
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    sunday: 'الأحد',
    
    // Months
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    april: 'أبريل',
    may: 'مايو',
    june: 'يونيو',
    july: 'يوليو',
    august: 'أغسطس',
    september: 'سبتمبر',
    october: 'أكتوبر',
    november: 'نوفمبر',
    december: 'ديسمبر',
    
    // Health
    mood: 'المزاج',
    energy: 'الطاقة',
    wellnessStatus: 'حالة الصحة',
    healthCheckin: 'فحص صحي',
    
    // Medications
    takeMedication: 'تناول الدواء',
    medicationReminder: 'تذكير الدواء',
    upcoming: 'قادم',
    
    // Emergency
    emergency: 'طوارئ',
    emergencyContact: 'جهة اتصال الطوارئ',
    callEmergency: 'اتصال طوارئ',
    
    // Font sizes
    small: 'صغير',
    medium: 'متوسط',
    large: 'كبير',
    extraLarge: 'كبير جداً',
    
    // Additional UI text
    hours: 'ساعات',
    preview: 'معاينة',
    currentTime: 'الوقت الحالي',
    appLanguage: 'لغة التطبيق',
    '12hourOr24hour': 'تنسيق 12 أو 24 ساعة',
    
    // UI Demo/Preview
    sampleHeading: 'عنوان تجريبي',
    bodyTextPreview: 'هكذا سيظهر نص المحتوى في التطبيق.',
    fontSizePreview: 'يمكنك استخدام هذه المعاينة لرؤية مدى وضوح النص بأحجام مختلفة.',
    lightThemeSample: 'عينة من الوضع الفاتح',
    darkThemeSample: 'عينة من الوضع الداكن',
  }
};

const LocalizationContext = createContext({
  language: 'en',
  timeFormat: '12h',
  t: (key) => key,
  setLanguage: () => {},
  setTimeFormat: () => {},
  formatTime: () => '',
  formatDate: () => '',
  isRTL: false,
});

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export const LocalizationProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [timeFormat, setTimeFormatState] = useState('12h');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences on app start
  useEffect(() => {
    loadPreferences();
  }, []);

  // Update RTL layout when language changes
  useEffect(() => {
    const isRTL = language === 'ar';
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }, [language]);

  const loadPreferences = async () => {
    try {
      const [savedLanguage, savedTimeFormat] = await Promise.all([
        AsyncStorage.getItem('app_language'),
        AsyncStorage.getItem('time_format')
      ]);
      
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
      
      if (savedTimeFormat) {
        setTimeFormatState(savedTimeFormat);
      }
    } catch (error) {
      console.error('Error loading localization preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (newLanguage) => {
    try {
      if (translations[newLanguage]) {
        setLanguageState(newLanguage);
        await AsyncStorage.setItem('app_language', newLanguage);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const setTimeFormat = async (newTimeFormat) => {
    try {
      setTimeFormatState(newTimeFormat);
      await AsyncStorage.setItem('time_format', newTimeFormat);
    } catch (error) {
      console.error('Error saving time format preference:', error);
    }
  };

  // Translation function
  const t = (key, fallback = null) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
  };

  // Format time according to user preference
  const formatTime = (date, options = {}) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const defaultOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: timeFormat === '12h'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      return dateObj.toLocaleTimeString(getLocale(), finalOptions);
    } catch (error) {
      // Fallback to basic format
      if (timeFormat === '12h') {
        return dateObj.toLocaleTimeString('en-US', finalOptions);
      } else {
        return dateObj.toLocaleTimeString('en-GB', finalOptions);
      }
    }
  };

  // Format date according to user language
  const formatDate = (date, options = {}) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const defaultOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      return dateObj.toLocaleDateString(getLocale(), finalOptions);
    } catch (error) {
      // Fallback to English
      return dateObj.toLocaleDateString('en-US', finalOptions);
    }
  };

  // Get locale string for Intl API
  const getLocale = () => {
    const localeMap = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      ar: 'ar-SA'
    };
    return localeMap[language] || 'en-US';
  };

  const isRTL = language === 'ar';

  if (isLoading) {
    return null; // Or a loading component
  }

  const value = {
    language,
    timeFormat,
    t,
    setLanguage,
    setTimeFormat,
    formatTime,
    formatDate,
    isRTL,
    getLocale,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export default LocalizationContext;
