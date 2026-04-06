import React, { useEffect, useCallback, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  scanPrinters,
  selectPrinter,
  saveDefaultPrinter,
  loadDefaultPrinter,
} from '../store/slices/printerSlice';
import { clearCart } from '../store/slices/searchSlice';
import { printerService } from '../services/printerService';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootStackParamList, Printer, CartItem } from '../types';
import { formatPrice } from '../utils/formatPrice';

type RouteType = RouteProp<RootStackParamList, 'PrintPreview'>;

const SKIP_WARNING_KEY = 'skip_back_warning';

export default function PrintPreviewScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { cart: initialCart } = route.params;

  const dispatch = useAppDispatch();
  const {
    list: printers,
    selected,
    scanning,
  } = useAppSelector(s => s.printers);

  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [printing, setPrinting] = useState(false);
  const [printed, setPrinted] = useState(false);
  const [hidePrice, setHidePrice] = useState(false);

  // Modal advertencia volver
  const [showWarning, setShowWarning] = useState(false);
  const [skipWarning, setSkipWarning] = useState(false);

  // Modal cambiar impresora
  const [showPrinterModal, setShowPrinterModal] = useState(false);

  // Modal nombre de impresora
  const [showNameModal, setShowNameModal] = useState(false);
  const [printerToName, setPrinterToName] = useState<Printer | null>(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    dispatch(loadDefaultPrinter());
  }, [dispatch]);

  const handleOpenPrinterModal = useCallback(() => {
    setShowPrinterModal(true);
    dispatch(scanPrinters());
  }, [dispatch]);

  const handleSelectPrinter = useCallback(
    (printer: Printer) => {
      dispatch(selectPrinter(printer));
      setShowPrinterModal(false);
    },
    [dispatch],
  );

  const handleRequestSetDefault = useCallback((printer: Printer) => {
    setPrinterToName(printer);
    setCustomName(printer.name);
    setShowNameModal(true);
  }, []);

  const handleConfirmName = useCallback(() => {
    if (!printerToName) return;
    const named: Printer = {
      ...printerToName,
      name: customName.trim() || printerToName.name,
    };
    dispatch(saveDefaultPrinter(named));
    dispatch(selectPrinter(named));
    setShowNameModal(false);
    setShowPrinterModal(false);
    Alert.alert(
      'Predeterminada',
      `"${named.name}" guardada como impresora predeterminada.`,
    );
  }, [printerToName, customName, dispatch]);

  const handleChangeCopies = useCallback((code: string, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.article.code === code
          ? { ...item, copies: Math.max(1, Math.min(99, item.copies + delta)) }
          : item,
      ),
    );
  }, []);

  const handleRemove = useCallback((code: string) => {
    setCart(prev => prev.filter(item => item.article.code !== code));
  }, []);

  const handlePrint = useCallback(async () => {
    if (!selected) {
      Alert.alert(
        'Sin impresora',
        'Seleccione una impresora antes de imprimir.',
      );
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Sin artículos', 'No hay artículos en la cola.');
      return;
    }
    setPrinting(true);
    try {
      for (const item of cart) {
        await printerService.print(
          item.article,
          selected,
          item.copies,
          hidePrice,
        );
      }
      const total = cart.reduce((acc, i) => acc + i.copies, 0);
      Alert.alert(
        'Enviado',
        `${total} etiqueta${total !== 1 ? 's' : ''} enviada${
          total !== 1 ? 's' : ''
        } a ${selected.name}.`,
      );
      setPrinted(true);
    } catch (error: any) {
      Alert.alert('Error de impresión', error.message);
    } finally {
      setPrinting(false);
    }
  }, [selected, cart, hidePrice]);

  const handleGoBack = useCallback(async () => {
    if (printed) {
      dispatch(clearCart());
      navigation.goBack();
      return;
    }
    const skip = await AsyncStorage.getItem(SKIP_WARNING_KEY);
    if (skip === 'true') {
      dispatch(clearCart());
      navigation.goBack();
      return;
    }
    setSkipWarning(false);
    setShowWarning(true);
  }, [printed, dispatch, navigation]);

  const handleConfirmBack = useCallback(async () => {
    if (skipWarning) {
      await AsyncStorage.setItem(SKIP_WARNING_KEY, 'true');
    }
    setShowWarning(false);
    dispatch(clearCart());
    navigation.goBack();
  }, [skipWarning, dispatch, navigation]);

  const totalEtiquetas = cart.reduce((acc, i) => acc + i.copies, 0);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Lista de artículos */}
        <Text style={styles.sectionTitle}>ARTÍCULOS A IMPRIMIR</Text>
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Icon name="shopping-cart" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyCartText}>
              No hay artículos en la cola
            </Text>
          </View>
        ) : (
          cart.map(item => (
            <View key={item.article.code} style={styles.cartItem}>
              <View style={styles.cartItemTop}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemCode}>{item.article.code}</Text>
                  <Text style={styles.cartItemDesc} numberOfLines={2}>
                    {item.article.description}
                  </Text>
                  <Text style={styles.cartItemPrice}>
                    {formatPrice(item.article.price, item.article.currency)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.article.code)}
                >
                  <Icon name="delete-outline" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <View style={styles.copiesRow}>
                <Text style={styles.copiesLabel}>Etiquetas:</Text>
                <View style={styles.copiesControls}>
                  <TouchableOpacity
                    style={styles.copiesBtn}
                    onPress={() => handleChangeCopies(item.article.code, -1)}
                  >
                    <Icon name="remove" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.copiesValue}>{item.copies}</Text>
                  <TouchableOpacity
                    style={styles.copiesBtn}
                    onPress={() => handleChangeCopies(item.article.code, 1)}
                  >
                    <Icon name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Impresora seleccionada */}
        <Text style={styles.sectionTitle}>IMPRESORA</Text>
        {selected ? (
          <View style={styles.selectedPrinterCard}>
            <Icon name="print" size={28} color={colors.primary} />
            <View style={styles.selectedPrinterInfo}>
              <Text style={styles.selectedPrinterName}>{selected.name}</Text>
              <Text style={styles.selectedPrinterIp}>
                {selected.ip}:{selected.port}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePrinterBtn}
              onPress={handleOpenPrinterModal}
            >
              <Text style={styles.changePrinterText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noPrinterCard}
            onPress={handleOpenPrinterModal}
          >
            <Icon name="print-disabled" size={24} color={colors.textDisabled} />
            <Text style={styles.noPrinterText}>Sin impresora seleccionada</Text>
            <Icon name="chevron-right" size={20} color={colors.textDisabled} />
          </TouchableOpacity>
        )}

        {/* Switch ocultar precio */}
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Icon name="money-off" size={20} color={colors.textSecondary} />
            <Text style={styles.switchLabel}>Imprimir sin precio</Text>
          </View>
          <Switch
            value={hidePrice}
            onValueChange={setHidePrice}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={hidePrice ? colors.primary : colors.textDisabled}
          />
        </View>

        {/* Botón imprimir */}
        <TouchableOpacity
          style={[
            styles.printBtn,
            (!selected || printing || cart.length === 0) &&
              styles.printBtnDisabled,
          ]}
          onPress={handlePrint}
          disabled={!selected || printing || cart.length === 0}
        >
          {printing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Icon name="print" size={22} color={colors.white} />
              <Text style={styles.printBtnText}>
                Imprimir {totalEtiquetas} etiqueta
                {totalEtiquetas !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Botón volver */}
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack}>
          <Icon name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal cambiar impresora */}
      <Modal visible={showPrinterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.printerModalCard}>
            <View style={styles.printerModalHeader}>
              <Text style={styles.printerModalTitle}>
                Seleccionar impresora
              </Text>
              <TouchableOpacity onPress={() => setShowPrinterModal(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {scanning ? (
              <View style={styles.scanningState}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.scanningText}>Escaneando la red...</Text>
              </View>
            ) : printers.length === 0 ? (
              <View style={styles.scanningState}>
                <Icon name="wifi-off" size={36} color={colors.textDisabled} />
                <Text style={styles.noPrintersText}>
                  No se encontraron impresoras
                </Text>
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={() => dispatch(scanPrinters())}
                >
                  <Icon name="refresh" size={18} color={colors.primary} />
                  <Text style={styles.rescanText}>Buscar de nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView>
                {printers.map(printer => {
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
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
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
                        style={styles.defaultBtn}
                        onPress={() => handleRequestSetDefault(printer)}
                      >
                        <Icon
                          name="star"
                          size={20}
                          color={isSelected ? colors.primary : colors.border}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal nombre de impresora */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.nameCard}>
            <Icon name="edit" size={28} color={colors.primary} />
            <Text style={styles.modalTitle}>Nombre de la impresora</Text>
            <Text style={styles.modalBody}>
              Asigná un nombre para identificarla fácilmente.
            </Text>
            <TextInput
              style={styles.nameInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="Ej: Caja 1, Bodega, Mostrador..."
              placeholderTextColor={colors.textDisabled}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmName}
              >
                <Text style={styles.modalConfirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal advertencia volver */}
      <Modal visible={showWarning} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.warningCard}>
            <Icon name="warning" size={36} color={colors.warning} />
            <Text style={styles.modalTitle}>¿Volver al inicio?</Text>
            <Text style={styles.modalBody}>
              Si volvés al inicio se perderán todos los artículos en la cola de
              impresión.
            </Text>
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setSkipWarning(prev => !prev)}
            >
              <View
                style={[styles.checkbox, skipWarning && styles.checkboxChecked]}
              >
                {skipWarning && (
                  <Icon name="check" size={14} color={colors.white} />
                )}
              </View>
              <Text style={styles.checkLabel}>
                No mostrar esta advertencia de nuevo
              </Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowWarning(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmBack}
              >
                <Text style={styles.modalConfirmText}>Volver</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  emptyCart: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyCartText: { ...typography.body, color: colors.textDisabled },
  cartItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cartItemTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cartItemInfo: { flex: 1 },
  cartItemCode: {
    ...typography.mono,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cartItemDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cartItemPrice: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  removeBtn: { padding: spacing.xs },
  copiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  copiesLabel: { ...typography.bodySmall, color: colors.textSecondary },
  copiesControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copiesBtn: {
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  copiesValue: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  selectedPrinterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  selectedPrinterInfo: { flex: 1 },
  selectedPrinterName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  selectedPrinterIp: { ...typography.bodySmall, color: colors.textSecondary },
  changePrinterBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  changePrinterText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  noPrinterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  noPrinterText: { ...typography.body, color: colors.textDisabled, flex: 1 },

  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  switchInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  switchLabel: { ...typography.body, color: colors.text },

  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  printBtnDisabled: { backgroundColor: colors.textDisabled },
  printBtnText: { ...typography.h3, color: colors.white },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  backBtnText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  printerModalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  printerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  printerModalTitle: { ...typography.h3, color: colors.text },
  scanningState: { alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  scanningText: { ...typography.body, color: colors.textSecondary },
  noPrintersText: { ...typography.body, color: colors.textDisabled },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rescanText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceAlt,
  },
  printerItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  printerInfo: { flex: 1 },
  printerName: { ...typography.body, fontWeight: '600', color: colors.text },
  printerNameSelected: { color: colors.primary },
  printerIp: { ...typography.bodySmall, color: colors.textSecondary },
  defaultBtn: { padding: spacing.xs },
  nameCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  nameInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
  },
  warningCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  modalTitle: { ...typography.h3, color: colors.text, textAlign: 'center' },
  modalBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkLabel: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xs,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  modalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  modalConfirmText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
});
