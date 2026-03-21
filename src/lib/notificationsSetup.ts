/**
 * Configuração global de notificações (comportamento em foreground).
 * Importar uma vez na raiz da app (App.tsx).
 */
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
