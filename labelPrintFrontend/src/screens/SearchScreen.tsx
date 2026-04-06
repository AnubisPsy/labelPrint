import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  fetchArticleByCode,
  setQuery,
  setLocalidad,
  clearSearch,
  addToCart,
  removeFromCart,
  updateCartCopies,
  clearCart,
} from '../store/slices/searchSlice';
import { Localidad } from '../services/articleService';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootStackParamList } from '../types';
import { formatPrice } from '../utils/formatPrice';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Search'>;

const LOCALIDADES: { key: Localidad; label: string }[] = [
  { key: 'la-ceiba', label: 'La Ceiba' },
  { key: 'tocoa', label: 'Tocoa' },
  { key: 'roatan', label: 'Roatán' },
];

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { query, result, cart, loading, error, localidad } = useAppSelector(
    s => s.search,
  );
  const inputRef = useRef<TextInput>(null);
  const lastChangeTime = useRef<number>(0);
  const [showKeyboard, setShowKeyboard] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => inputRef.current?.focus(), 100);
    }, []),
  );

  const handleChangeText = useCallback(
    (text: string) => {
      dispatch(setQuery(text));

      if (showKeyboard) return; // usuario escribiendo → solo actualiza el texto

      lastChangeTime.current = Date.now();
      setTimeout(() => {
        if (Date.now() - lastChangeTime.current >= 100) {
          const code = text.trim();
          if (code) {
            dispatch(setQuery(''));
            setShowKeyboard(false);
            Keyboard.dismiss();
            dispatch(fetchArticleByCode({ code, localidad }));
          }
        }
      }, 100);
    },
    [dispatch, localidad, showKeyboard],
  );

  const handleSearch = useCallback(() => {
    const code = query.trim();
    if (!code) return;
    setShowKeyboard(false); // ← oculta el teclado
    Keyboard.dismiss();
    dispatch(setQuery('')); // ← limpia el label
    dispatch(fetchArticleByCode({ code, localidad }));
    setTimeout(() => inputRef.current?.focus(), 300); // ← vuelve el autofocus
  }, [dispatch, query, localidad]);

  const handleClear = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  const handleAddToCart = useCallback(() => {
    if (result) {
      dispatch(addToCart(result));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [dispatch, result]);

  const handleGoToPrint = useCallback(() => {
    if (result) {
      const cartWithResult = [...cart, { article: result, copies: 1 }];
      navigation.navigate('PrintPreview', { cart: cartWithResult });
    } else if (cart.length > 0) {
      navigation.navigate('PrintPreview', { cart });
    }
  }, [navigation, result, cart]);

  const handleLocalidad = useCallback(
    (loc: Localidad) => dispatch(setLocalidad(loc)),
    [dispatch],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.localidadCard}>
          <Text style={styles.label}>LISTA DE PRECIOS</Text>
          <View style={styles.localidadRow}>
            {LOCALIDADES.map(loc => (
              <TouchableOpacity
                key={loc.key}
                style={[
                  styles.localidadBtn,
                  localidad === loc.key && styles.localidadBtnActive,
                ]}
                onPress={() => handleLocalidad(loc.key)}
              >
                <Text
                  style={[
                    styles.localidadBtnText,
                    localidad === loc.key && styles.localidadBtnTextActive,
                  ]}
                >
                  {loc.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.label}>CÓDIGO DE ARTÍCULO</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={handleChangeText}
              onSubmitEditing={handleSearch}
              placeholder="Escanee o escriba el código"
              placeholderTextColor={colors.textDisabled}
              autoFocus={false}
              showSoftInputOnFocus={showKeyboard}
              returnKeyType="search"
              autoCapitalize="characters"
              onPressIn={() => setShowKeyboard(true)}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <Icon name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSearch}
              style={[styles.searchBtn, loading && styles.searchBtnDisabled]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Icon name="search" size={22} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Icon name="error-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Icon name="inventory-2" size={18} color={colors.primary} />
              <Text style={styles.resultHeaderText}>Artículo encontrado</Text>
            </View>
            <Text style={styles.resultCode}>{result.code}</Text>
            <Text style={styles.resultDescription}>{result.description}</Text>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Precio</Text>
              <Text style={styles.priceValue}>
                {formatPrice(result.price, result.currency)}
              </Text>
            </View>
            {result.unit && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Unidad</Text>
                <Text style={styles.metaValue}>{result.unit}</Text>
              </View>
            )}
            {result.category && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Categoría</Text>
                <Text style={styles.metaValue}>{result.category}</Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
                <Icon
                  name="add-shopping-cart"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.addBtnText}>Agregar otro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={handleGoToPrint}
              >
                <Icon name="print" size={20} color={colors.white} />
                <Text style={styles.printBtnText}>Imprimir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {cart.length > 0 && (
          <View style={styles.cartSection}>
            <View style={styles.cartHeader}>
              <View style={styles.cartTitleRow}>
                <Icon name="shopping-cart" size={18} color={colors.primary} />
                <Text style={styles.cartTitle}>En cola ({cart.length})</Text>
              </View>
              <TouchableOpacity onPress={() => dispatch(clearCart())}>
                <Text style={styles.clearCartText}>Limpiar todo</Text>
              </TouchableOpacity>
            </View>

            {cart.map(item => (
              <View key={item.article.code} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemCode}>{item.article.code}</Text>
                  <Text style={styles.cartItemDesc} numberOfLines={1}>
                    {item.article.description}
                  </Text>
                  <Text style={styles.cartItemPrice}>
                    {formatPrice(item.article.price, item.article.currency)}
                  </Text>
                </View>
                <View style={styles.cartItemControls}>
                  <TouchableOpacity
                    style={styles.cartQtyBtn}
                    onPress={() =>
                      dispatch(
                        updateCartCopies({
                          code: item.article.code,
                          copies: item.copies - 1,
                        }),
                      )
                    }
                  >
                    <Icon name="remove" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.cartQtyValue}>{item.copies}</Text>
                  <TouchableOpacity
                    style={styles.cartQtyBtn}
                    onPress={() =>
                      dispatch(
                        updateCartCopies({
                          code: item.article.code,
                          copies: item.copies + 1,
                        }),
                      )
                    }
                  >
                    <Icon name="add" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cartRemoveBtn}
                    onPress={() => dispatch(removeFromCart(item.article.code))}
                  >
                    <Icon
                      name="delete-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {!result && (
              <TouchableOpacity
                style={styles.printAllBtn}
                onPress={handleGoToPrint}
              >
                <Icon name="print" size={20} color={colors.white} />
                <Text style={styles.printAllBtnText}>
                  Imprimir {cart.reduce((acc, i) => acc + i.copies, 0)} etiqueta
                  {cart.reduce((acc, i) => acc + i.copies, 0) !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!result && cart.length === 0 && !loading && !error && (
          <View style={styles.emptyState}>
            <Icon name="qr-code-scanner" size={64} color={colors.border} />
            <Text style={styles.emptyText}>
              Escanee un código o escríbalo manualmente
            </Text>
          </View>
        )}
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Copyright</Text>
          <Text style={styles.footerText}>Departamento de IT | MADEYSO</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  localidadCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  localidadRow: { flexDirection: 'row', gap: spacing.sm },
  localidadBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  localidadBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  localidadBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  localidadBtnTextActive: { color: colors.white },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.mono,
    color: colors.text,
  },
  clearBtn: { padding: spacing.sm },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: { backgroundColor: colors.textDisabled },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: { ...typography.body, color: colors.danger, flex: 1 },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  resultHeaderText: { ...typography.label, color: colors.primary },
  resultCode: {
    ...typography.mono,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  resultDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceLabel: { ...typography.body, color: colors.textSecondary },
  priceValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metaLabel: { ...typography.bodySmall, color: colors.textSecondary },
  metaValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
  },
  addBtnText: { ...typography.body, color: colors.primary, fontWeight: '700' },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
  },
  printBtnText: { ...typography.body, color: colors.white, fontWeight: '700' },
  cartSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cartTitle: { ...typography.label, color: colors.primary },
  clearCartText: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  cartItemInfo: { flex: 1 },
  cartItemCode: {
    ...typography.mono,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  cartItemDesc: { ...typography.bodySmall, color: colors.textSecondary },
  cartItemPrice: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cartQtyBtn: {
    padding: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  cartQtyValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  cartRemoveBtn: { padding: 4, marginLeft: spacing.xs },
  printAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  printAllBtnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.textDisabled,
    fontSize: 11,
  },
});
