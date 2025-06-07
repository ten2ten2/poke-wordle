import { ReactNode } from 'react';

// 精灵球图标组件
function PokeballIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 外圈黑色边框 */}
      <circle cx="12" cy="12" r="11" fill="#000000" stroke="#000000" strokeWidth="2"/>
      
      {/* 上半部分 - 红色 */}
      <path d="M12 1C18.075 1 23 5.925 23 12H1C1 5.925 5.925 1 12 1Z" fill="#dc2626"/>
      
      {/* 下半部分 - 白色 */}
      <path d="M1 12C1 18.075 5.925 23 12 23C18.075 23 23 18.075 23 12H1Z" fill="#ffffff"/>
      
      {/* 中间分割线 */}
      <rect x="1" y="11" width="22" height="2" fill="#000000"/>
      
      {/* 中心白色圆圈 */}
      <circle cx="12" cy="12" r="4" fill="#ffffff" stroke="#000000" strokeWidth="1"/>
      
      {/* 中心按钮 */}
      <circle cx="12" cy="12" r="2" fill="#ffffff" stroke="#000000" strokeWidth="1"/>
      <circle cx="12" cy="12" r="1" fill="#000000"/>
    </svg>
  );
}

export function FAQ({ children }: { children: ReactNode }) {
  return (
    <section itemScope itemType="https://schema.org/FAQPage">
      {children}
    </section>
  );
}

export function Question({ children }: { children: ReactNode }) {
  return (
    <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
      <h2 itemProp="name" className="flex items-center gap-2">
        <PokeballIcon />
        {children}
      </h2>
    </div>
  );
}

export function Answer({ children }: { children: ReactNode }) {
  return (
    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
      <div itemProp="text">{children}</div>
    </div>
  );
} 