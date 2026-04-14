import { WebContainer } from '@webcontainer/api';
import { persistenceService } from './persistence';
import { WORK_DIR_NAME } from '../constants'; 

export class WebContainerService {
  private static instance: Promise<WebContainer> | null = null;

  public static getInstance(): Promise<WebContainer> {
    if (!WebContainerService.instance) {
      WebContainerService.instance = (async () => {
        // 1. Boot the WebContainer OS
        const container = await WebContainer.boot({
          workdirName: WORK_DIR_NAME,
        });

        console.log(`[WebContainer] Booted at: /${WORK_DIR_NAME}`);

        // 2. Start your reactive auto-sync loop to listen for any file changes!
        await persistenceService.startAutoSync(container, `/${WORK_DIR_NAME}`);

        return container;
      })();
    }
    return WebContainerService.instance;
  }
}

export const getWebContainer = WebContainerService.getInstance;
