import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMaintenance() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  useEffect(() => {
    checkMaintenance();

    // Subscribe to realtime changes di app_config
    const channel = supabase
      .channel('app_config_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_config', filter: 'key=eq.is_maintenance' },
        (payload) => {
          const val = payload.new?.value;
          setIsMaintenance(val === 'true');
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function checkMaintenance() {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'is_maintenance')
      .single();

    if (data) {
      setIsMaintenance(data.value === 'true');
    }

    // Ambil juga pesan maintenance jika ada
    const { data: msgData } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'maintenance_message')
      .single();

    if (msgData) setMaintenanceMsg(msgData.value);
  }

  return { isMaintenance, maintenanceMsg };
}
