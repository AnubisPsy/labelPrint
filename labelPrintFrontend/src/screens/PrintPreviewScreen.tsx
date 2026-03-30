import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  scanPrinters,
  selectPrinter,
  saveDefaultPrinter,
} from '../store/slices/printerSlice';
import { printerService } from '../services/printerService';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootStackParamList, Printer } from '../types';

type RouteType = RouteProp<RootStackParamList, 'PrintPreview'>;

export default function PrintPreviewScreen() {
  const route = useRoute<RouteType>();
  const { article } = route.params;

  const dispatch = useAppDispatch();
  const {
    list: printers,
    selected,
    scanning,
  } = useAppSelector(s => s.printers);

  const [copies, setCopies] = useState(1);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    dispatch(scanPrinters());
  }, [dispatch]);

  const handleChangeCopies = useCallback((delta: number) => {
    setCopies(prev => Math.max(1, Math.min(99, prev + delta)));
  }, []);

  const handleSelectPrinter = useCallback(
    (printer: Printer) => {
      dispatch(selectPrinter(printer));
    },
    [dispatch],
  );

  const handleSetDefault = useCallback(
    (printer: Printer) => {
      dispatch(saveDefaultPrinter(printer));
      Alert.alert(
        'Predeterminada',
        `${printer.name} guardada como impresora predeterminada.`,
      );
    },
    [dispatch],
  );

  const handlePrint = useCallback(async () => {
    if (!selected) {
      Alert.alert(
        'Sin impresora',
        'Seleccione una impresora antes de imprimir.',
      );
      return;
    }
    setPrinting(true);
    try {
      await printerService.print(article, selected, copies);
      Alert.alert(
        'Enviado',
        `${copies} etiqueta${copies > 1 ? 's' : ''} enviada${
          copies > 1 ? 's' : ''
        } a ${selected.name}.`,
      );
    } catch (error: any) {
      Alert.alert('Error de impresión', error.message);
    } finally {
      setPrinting(false);
    }
  }, [selected, article, copies]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Vista previa de etiqueta */}
      <Text style={styles.sectionTitle}>VISTA PREVIA DE ETIQUETA</Text>
      <View style={styles.labelPreview}>
        {/* Barcode simulado */}
        <View style={styles.barcodeContainer}>
          <View style={styles.barcodeBars}>
            {Array.from({ length: 30 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.barcodeBar,
                  { width: i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.barcodeNumber}>
            {article.barcode ?? article.code}
          </Text>
        </View>

        {/* Precio grande */}
        <Text style={styles.labelPrice}>L.{article.price.toFixed(2)}</Text>

        {/* Código y descripción */}
        <View style={styles.labelBottom}>
          <Text style={styles.labelCode}>{article.code}</Text>
          <Text style={styles.labelDescription} numberOfLines={1}>
            {article.description}
          </Text>
        </View>
      </View>

      {/* Selector de copias */}
      <Text style={styles.sectionTitle}>CANTIDAD DE ETIQUETAS</Text>
      <View style={styles.copiesCard}>
        <TouchableOpacity
          style={styles.copiesBtn}
          onPress={() => handleChangeCopies(-1)}
        >
          <Icon name="remove" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.copiesValue}>{copies}</Text>
        <TouchableOpacity
          style={styles.copiesBtn}
          onPress={() => handleChangeCopies(1)}
        >
          <Icon name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Selector de impresora */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SELECCIONAR IMPRESORA</Text>
        <TouchableOpacity
          onPress={() => dispatch(scanPrinters())}
          disabled={scanning}
          style={styles.rescanBtn}
        >
          {scanning ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="refresh" size={18} color={colors.primary} />
          )}
          <Text style={styles.rescanText}>
            {scanning ? 'Buscando...' : 'Buscar'}
          </Text>
        </TouchableOpacity>
      </View>

      {scanning && printers.length === 0 ? (
        <View style={styles.scanningState}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.scanningText}>Escaneando la red...</Text>
        </View>
      ) : printers.length === 0 ? (
        <View style={styles.noPrinters}>
          <Icon name="wifi-off" size={32} color={colors.textDisabled} />
          <Text style={styles.noPrintersText}>
            No se encontraron impresoras en la red
          </Text>
        </View>
      ) : (
        printers.map(printer => {
          const isSelected = selected?.ip === printer.ip;
          return (
            <TouchableOpacity
              key={printer.ip}
              style={[
                styles.printerItem,
                isSelected && styles.printerItemSelected,
              ]}
              onPress={() => handleSelectPrinter(printer)}
            >
              <Icon
                name="print"
                size={24}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
              <View style={styles.printerInfo}>
                <Text
                  style={[
                    styles.printerName,
                    isSelected && styles.printerNameSelected,
                  ]}
                >
                  {printer.name}
                </Text>
                <Text style={styles.printerIp}>
                  {printer.ip}:{printer.port}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleSetDefault(printer)}
                style={styles.defaultBtn}
              >
                <Icon
                  name="star"
                  size={20}
                  color={isSelected ? colors.primary : colors.border}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })
      )}

      {/* Botón de impresión */}
      <TouchableOpacity
        style={[
          styles.printBtn,
          (!selected || printing) && styles.printBtnDisabled,
        ]}
        onPress={handlePrint}
        disabled={!selected || printing}
      >
        {printing ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Icon name="print" size={22} color={colors.white} />
            <Text style={styles.printBtnText}>
              Imprimir {copies} etiqueta{copies > 1 ? 's' : ''}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  rescanText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  labelPreview: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    ...shadows.sm,
  },
  labelCode: {
    ...typography.mono,
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  labelDescription: {
    ...typography.body,
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  labelPriceLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  labelCurrency: {
    ...typography.body,
    color: colors.text,
    marginTop: 4,
  },
  labelPrice: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  labelUnit: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  barcodePlaceholder: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barcodePlaceholderText: {
    ...typography.mono,
    color: colors.textDisabled,
    fontSize: 12,
  },
  copiesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xl,
    ...shadows.sm,
  },
  copiesBtn: {
    padding: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  copiesValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    minWidth: 60,
    textAlign: 'center',
  },
  scanningState: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  scanningText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  noPrinters: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  noPrintersText: {
    ...typography.body,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  printerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  printerNameSelected: {
    color: colors.primary,
  },
  printerIp: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  defaultBtn: {
    padding: spacing.xs,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.xl,
    ...shadows.md,
  },
  printBtnDisabled: {
    backgroundColor: colors.textDisabled,
  },
  printBtnText: {
    ...typography.h3,
    color: colors.white,
  },
  barcodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
     barcodeBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 35,
    width: '100%',
    gap: 1,
  },
  barcodeBar: {
    flex: 1, 
    height: '100%',
    backgroundColor: colors.text,
  }, 
  barcodeNumber: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text,
    marginTop: spacing.xs,
  },
  labelBottom: {
    width: '100%',
  },
});
