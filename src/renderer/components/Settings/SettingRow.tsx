import React from 'react';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => {
  return (
    <div className="settings-row">
      <div className="flex-1 pr-4">
        <h3 className="text-[15px] font-normal text-(--color-text-primary)">{label}</h3>
        {description && <p className="text-[13px] mt-0.5 text-(--color-text-secondary)">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
};
