import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { Icon } from '@/components/common/Icon';

const BackupSettings = ({ onSave }) => {
  const [backupLocation, setBackupLocation] = useState('project');
  const [customPath, setCustomPath] = useState('');
  const [maxBackups, setMaxBackups] = useState(30);
  const [saving, setSaving] = useState(false);

  const backupLocations = [
    { value: 'project', label: 'Project Folder (Default)', path: 'C:\\xampp\\htdocs\\Theory\\PosRes1\\backups' },
    { value: 'desktop', label: 'Desktop', path: '~/Desktop/POS-Backups' },
    { value: 'documents', label: 'Documents', path: '~/Documents/POS-Backups' },
    { value: 'downloads', label: 'Downloads', path: '~/Downloads/POS-Backups' },
    { value: 'custom', label: 'Custom Path', path: 'Custom location' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save backup settings
      const settings = {
        backupLocation,
        customPath: backupLocation === 'custom' ? customPath : '',
        maxBackups: parseInt(maxBackups)
      };

      // Call parent save function
      if (onSave) {
        await onSave(settings);
      }

      toast.success('Backup settings saved successfully!');
    } catch (error) {
      console.error('Failed to save backup settings:', error);
      toast.error('Failed to save backup settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = (value) => {
    setBackupLocation(value);
    if (value === 'custom') {
      setCustomPath('C:\\POS-Backups'); // Default custom path
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="backup" className="w-5 h-5" />
          Backup Storage Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="backup-location">Backup Storage Location</Label>
          <Select value={backupLocation} onValueChange={handleLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select backup location" />
            </SelectTrigger>
            <SelectContent>
              {backupLocations.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{location.label}</span>
                    <span className="text-sm text-gray-500">{location.path}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {backupLocation === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-path">Custom Backup Path</Label>
            <Input
              id="custom-path"
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              placeholder="C:\\MyBackups"
              className="font-mono"
            />
            <p className="text-sm text-gray-500">
              Enter the full path where backup files should be stored
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="max-backups">Maximum Backup Files to Keep</Label>
          <Input
            id="max-backups"
            type="number"
            min="1"
            max="100"
            value={maxBackups}
            onChange={(e) => setMaxBackups(e.target.value)}
            className="w-32"
          />
          <p className="text-sm text-gray-500">
            Older backup files will be automatically deleted when this limit is reached
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 How to Apply Changes</h4>
          <p className="text-sm text-blue-800">
            After saving these settings, you need to restart the server for the changes to take effect:
          </p>
          <div className="mt-2 p-2 bg-blue-100 rounded font-mono text-sm">
            npm run dev
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Backup Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BackupSettings;
