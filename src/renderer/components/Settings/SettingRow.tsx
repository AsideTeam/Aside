import React from 'react';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{label}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
};
