import { useEffect, useState, useCallback } from 'react';
import { loadScript, loadScriptOnInteraction, isScriptLoaded } from '@/utils/scriptLoader';

interface UseScriptLoaderOptions {
  src: string;
  async?: boolean;
  defer?: boolean;
  crossOrigin?: string;
  integrity?: string;
  loadOnInteraction?: boolean;
  interactionDelay?: number;
}

interface UseScriptLoaderReturn {
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

/**
 * 自定义 hook 用于管理脚本加载
 * @param options 脚本加载选项
 * @returns 脚本加载状态和控制函数
 */
export const useScriptLoader = (options: UseScriptLoaderOptions): UseScriptLoaderReturn => {
  const { src, loadOnInteraction = false, interactionDelay = 2000, ...scriptOptions } = options;
  
  const [loaded, setLoaded] = useState(() => isScriptLoaded(src));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (loaded || loading) return;

    setLoading(true);
    setError(null);

    try {
      const loadFunction = loadOnInteraction 
        ? () => loadScriptOnInteraction({ src, ...scriptOptions }, interactionDelay)
        : () => loadScript({ src, ...scriptOptions });

      await loadFunction();
      setLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load script';
      setError(errorMessage);
      console.error('Script loading error:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [src, loaded, loading, loadOnInteraction, interactionDelay, scriptOptions]);

  useEffect(() => {
    // 检查脚本是否已经加载
    if (isScriptLoaded(src)) {
      setLoaded(true);
    }
  }, [src]);

  return { loaded, loading, error, load };
};

/**
 * 用于 Google Analytics 的专用 hook
 * @param measurementId GA 测量 ID
 * @param loadOnInteraction 是否在用户交互时加载
 * @returns GA 脚本加载状态
 */
export const useGoogleAnalytics = (
  measurementId: string,
  loadOnInteraction: boolean = true
): UseScriptLoaderReturn => {
  return useScriptLoader({
    src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
    async: true,
    loadOnInteraction,
    interactionDelay: 2000,
  });
};

/**
 * 用于 Google AdSense 的专用 hook
 * @param publisherId AdSense 发布者 ID
 * @param loadOnInteraction 是否在用户交互时加载
 * @returns AdSense 脚本加载状态
 */
export const useGoogleAdSense = (
  publisherId: string,
  loadOnInteraction: boolean = true
): UseScriptLoaderReturn => {
  return useScriptLoader({
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`,
    async: true,
    crossOrigin: 'anonymous',
    loadOnInteraction,
    interactionDelay: 3000,
  });
};

/**
 * 批量加载多个脚本的 hook
 * @param scripts 脚本配置数组
 * @returns 所有脚本的加载状态
 */
export const useMultipleScripts = (scripts: UseScriptLoaderOptions[]) => {
  const [allLoaded, setAllLoaded] = useState(false);
  const [anyLoading, setAnyLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // 为每个脚本创建独立的 hook 调用
  const scriptStates = scripts.map((script) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useScriptLoader(script);
  });

  useEffect(() => {
    const loaded = scriptStates.every(state => state.loaded);
    const loading = scriptStates.some(state => state.loading);
    const scriptErrors = scriptStates
      .filter(state => state.error)
      .map(state => state.error!);

    setAllLoaded(loaded);
    setAnyLoading(loading);
    setErrors(scriptErrors);
  }, [scriptStates]);

  const loadAll = useCallback(async () => {
    await Promise.all(scriptStates.map(state => state.load()));
  }, [scriptStates]);

  return {
    allLoaded,
    anyLoading,
    errors,
    loadAll,
    scripts: scriptStates,
  };
};

/**
 * 条件加载脚本的 hook
 * @param condition 加载条件
 * @param options 脚本选项
 * @returns 脚本加载状态
 */
export const useConditionalScript = (
  condition: boolean,
  options: UseScriptLoaderOptions
): UseScriptLoaderReturn => {
  const scriptLoader = useScriptLoader(options);

  useEffect(() => {
    if (condition && !scriptLoader.loaded && !scriptLoader.loading) {
      scriptLoader.load();
    }
  }, [condition, scriptLoader]);

  return scriptLoader;
}; 