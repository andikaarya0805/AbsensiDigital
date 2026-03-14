import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Modal } from 'react-native';
import { COLORS, RADIUS, SHADOW } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import QRCode from 'react-native-qrcode-svg';
import { RefreshCw, Clock, Maximize2, X, Share2, Info } from 'lucide-react-native';

export default function QRScreen() {
  const { user } = useAuth();
  const [qrValue, setQrValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const QR_SECRET = process.env.EXPO_PUBLIC_QR_SECRET || 'FALLBACK_SECRET';
  const REFRESH_INTERVAL = 30;

  const generateQR = useCallback(() => {
    const timestamp = Math.floor(Date.now() / (REFRESH_INTERVAL * 1000));
    const session = user?.subject || 'DEFAULT';
    setQrValue(`HADIR_SESSION_${timestamp}_${QR_SECRET}_${session}`);
    setTimeLeft(REFRESH_INTERVAL);
  }, [user]);

  useEffect(() => {
    generateQR();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateQR();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [generateQR]);

  return (
    <View style={styles.container}>
      <Modal visible={isFullscreen} animationType="slide" transparent={false}>
          <View style={styles.fullscreenOverlay}>
              <TouchableOpacity onPress={() => setIsFullscreen(false)} style={styles.closeBtn}>
                  <X size={32} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.fsHeader}>
                  <Text style={styles.fsLabel}>PRESENSI REAL-TIME</Text>
                  <Text style={styles.fsSubject}>{user?.subject || 'HadirMu'}</Text>
              </View>

              <View style={styles.fsQrWrapper}>
                  <QRCode value={qrValue} size={300} backgroundColor="white" />
              </View>

              <View style={styles.fsTimerRow}>
                  <Clock size={28} color="#fff" />
                  <Text style={styles.fsTimerText}>{timeLeft}s</Text>
              </View>

              <View style={styles.fsProgressBar}>
                  <View style={[styles.fsProgressFill, { width: `${(timeLeft/30)*100}%` }]} />
              </View>
              
              <Text style={styles.fsHint}>Silakan arahkan kamera HP Siswa ke layar ini</Text>
          </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Presensi QR</Text>
        <Text style={styles.sub}>QR berganti otomatis tiap {REFRESH_INTERVAL} detik</Text>
      </View>

      <View style={[styles.qrCard, SHADOW.card]}>
        <View style={styles.qrWrapper}>
          {qrValue ? <QRCode value={qrValue} size={200} /> : <View style={styles.qrPlaceholder} />}
        </View>

        <View style={styles.timerRow}>
          <Clock size={20} color={COLORS.primary} />
          <Text style={styles.timerText}>Berlaku: {timeLeft} detik</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(timeLeft/30)*100}%` }]} />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={generateQR}>
          <RefreshCw size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => setIsFullscreen(true)}>
          <Maximize2 size={20} color="#fff" />
          <Text style={[styles.actionText, { color: '#fff' }]}>Fullscreen</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Info size={18} color={COLORS.textSub} />
        <Text style={styles.infoText}>Siswa harus terverifikasi untuk melakukan presensi.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 24,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: 8,
  },
  fsHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  fsLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  fsSubject: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 8,
  },
  fsQrWrapper: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: RADIUS.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    shadowOpacity: 0.5,
    elevation: 10,
  },
  fsTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  fsTimerText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  fsProgressBar: {
    width: 250,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  fsProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  fsHint: {
    color: '#64748b',
    marginTop: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
  },
  sub: {
    fontSize: 14,
    color: COLORS.textSub,
    marginTop: 4,
  },
  qrCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.bg,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: RADIUS.lg,
    marginTop: 40,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSub,
    lineHeight: 18,
  },
  footerText: {
    color: COLORS.textSub,
    fontSize: 11,
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 20,
  }
});
