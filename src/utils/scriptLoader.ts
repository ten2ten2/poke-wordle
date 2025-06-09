// 脚本加载器工具，用于按需加载第三方脚本

interface ScriptLoadOptions {
  src: string;
  async?: boolean;
  defer?: boolean;
  crossOrigin?: string;
  integrity?: string;
  onLoad?: () => void;
  onError?: (error: Event) => void;
}

// 已加载的脚本缓存
const loadedScripts = new Set<string>();
const loadingScripts = new Map<string, Promise<void>>();

/**
 * 动态加载脚本
 * @param options 脚本加载选项
 * @returns Promise<void>
 */
export const loadScript = (options: ScriptLoadOptions): Promise<void> => {
  const { src, async = true, defer = false, crossOrigin, integrity, onLoad, onError } = options;

  // 如果脚本已经加载，直接返回
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }

  // 如果脚本正在加载，返回现有的 Promise
  if (loadingScripts.has(src)) {
    return loadingScripts.get(src)!;
  }

  // 创建新的加载 Promise
  const loadPromise = new Promise<void>((resolve, reject) => {
    // 检查脚本是否已经存在于 DOM 中
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      loadedScripts.add(src);
      resolve();
      return;
    }

    // 创建新的 script 元素
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;

    if (crossOrigin) {
      script.crossOrigin = crossOrigin;
    }

    if (integrity) {
      script.integrity = integrity;
    }

    script.onload = () => {
      loadedScripts.add(src);
      loadingScripts.delete(src);
      onLoad?.();
      resolve();
    };

    script.onerror = (error) => {
      loadingScripts.delete(src);
      if (onError && error instanceof Event) {
        onError(error);
      }
      reject(new Error(`Failed to load script: ${src}`));
    };

    // 添加到 head
    document.head.appendChild(script);
  });

  loadingScripts.set(src, loadPromise);
  return loadPromise;
};

/**
 * 延迟加载脚本，在用户交互或指定延迟后加载
 * @param options 脚本加载选项
 * @param delay 延迟时间（毫秒），默认 2000ms
 * @returns Promise<void>
 */
export const loadScriptOnInteraction = (
  options: ScriptLoadOptions,
  delay: number = 2000
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let loaded = false;

    const loadScriptNow = async () => {
      if (loaded) return;
      loaded = true;

      try {
        await loadScript(options);
        resolve();
      } catch (error) {
        reject(error);
      }

      // 清理事件监听器
      document.removeEventListener('scroll', loadScriptNow);
      document.removeEventListener('mousemove', loadScriptNow);
      document.removeEventListener('touchstart', loadScriptNow);
      document.removeEventListener('click', loadScriptNow);
      document.removeEventListener('keydown', loadScriptNow);
    };

    // 设置延迟加载
    const timeoutId = setTimeout(loadScriptNow, delay);

    // 监听用户交互事件
    document.addEventListener('scroll', loadScriptNow, { passive: true, once: true });
    document.addEventListener('mousemove', loadScriptNow, { passive: true, once: true });
    document.addEventListener('touchstart', loadScriptNow, { passive: true, once: true });
    document.addEventListener('click', loadScriptNow, { passive: true, once: true });
    document.addEventListener('keydown', loadScriptNow, { passive: true, once: true });

    // 清理函数
    const cleanup = () => {
      clearTimeout(timeoutId);
      document.removeEventListener('scroll', loadScriptNow);
      document.removeEventListener('mousemove', loadScriptNow);
      document.removeEventListener('touchstart', loadScriptNow);
      document.removeEventListener('click', loadScriptNow);
      document.removeEventListener('keydown', loadScriptNow);
    };

    // 如果 Promise 被拒绝，清理事件监听器
    loadScriptNow().catch(() => {
      cleanup();
    });
  });
};

/**
 * 使用 Intersection Observer 在元素进入视口时加载脚本
 * @param element 目标元素
 * @param options 脚本加载选项
 * @param threshold 交叉阈值，默认 0.1
 * @returns Promise<void>
 */
export const loadScriptOnIntersection = (
  element: Element,
  options: ScriptLoadOptions,
  threshold: number = 0.1
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('IntersectionObserver' in window)) {
      // 如果不支持 Intersection Observer，直接加载
      loadScript(options).then(resolve).catch(reject);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect();
            loadScript(options).then(resolve).catch(reject);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);
  });
};

/**
 * 预加载脚本（仅下载，不执行）
 * @param src 脚本 URL
 */
export const preloadScript = (src: string): void => {
  if (loadedScripts.has(src)) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = src;
  document.head.appendChild(link);
};

/**
 * 批量加载脚本
 * @param scripts 脚本配置数组
 * @returns Promise<void[]>
 */
export const loadScripts = (scripts: ScriptLoadOptions[]): Promise<void[]> => {
  return Promise.all(scripts.map(script => loadScript(script)));
};

/**
 * 检查脚本是否已加载
 * @param src 脚本 URL
 * @returns boolean
 */
export const isScriptLoaded = (src: string): boolean => {
  return loadedScripts.has(src);
};

/**
 * 移除已加载的脚本
 * @param src 脚本 URL
 */
export const removeScript = (src: string): void => {
  const script = document.querySelector(`script[src="${src}"]`);
  if (script) {
    script.remove();
    loadedScripts.delete(src);
  }
}; 