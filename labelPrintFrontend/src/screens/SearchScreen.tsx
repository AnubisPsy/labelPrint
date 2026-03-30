import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
} from '../store/slices/searchSlice';
import { Localidad } from '../services/articleService';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Search'>;

const LOCALIDADES: { key: Localidad; label: string }[] = [
  { key: 'la-ceiba', label: 'La Ceiba' },
  { key: 'tocoa', label: 'Tocoa' },
  { key: 'roatan', label: 'Roatán' },
];

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { query, result, loading, error, localidad } = useAppSelector(
    s => s.search,
  );
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      if (text.endsWith('\n')) {
        const code = text.trim();
        if (code) {
          dispatch(setQuery(code));
          dispatch(fetchArticleByCode({ code, localidad }));
        }
        return;
      }
      dispatch(setQuery(text));
    },
    [dispatch, localidad],
  );

  const handleSearch = useCallback(() => {
    const code = query.trim();
    if (!code) return;
    dispatch(fetchArticleByCode({ code, localidad }));
  }, [dispatch, query, localidad]);

  const handleClear = useCallback(() => {
    dispatch(clearSearch());
    inputRef.current?.focus();
  }, [dispatch]);

  const handleGoToPrint = useCallback(() => {
    if (result) {
      navigation.navigate('PrintPreview', { article: result });
    }
  }, [navigation, result]);

  const handleLocalidad = useCallback(
    (loc: Localidad) => {
      dispatch(setLocalidad(loc));
      inputRef.current?.focus();
    },
    [dispatch],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Selector de localidad */}
      <View style={styles.localidadCard}>
        <Text style={styles.label}>SUCURSAL</Text>
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

      {/* Campo de búsqueda */}
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
            autoFocus
            returnKeyType="search"
            autoCapitalize="characters"
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

      {/* Error */}
      {error && (
        <View style={styles.errorCard}>
          <Icon name="error-outline" size={20} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Resultado */}
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
              {result.currency} {result.price.toFixed(2)}
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

          <TouchableOpacity style={styles.printBtn} onPress={handleGoToPrint}>
            <Icon name="print" size={20} color={colors.white} />
            <Text style={styles.printBtnText}>Ir a imprimir etiqueta</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Estado vacío */}
      {!result && !loading && !error && (
        <View style={styles.emptyState}>
          <Icon name="qr-code-scanner" size={64} color={colors.border} />
          <Text style={styles.emptyText}>
            Escanee un código o escríbalo manualmente
          </Text>
        </View>
      )}
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
  localidadRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
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
  localidadBtnTextActive: {
    color: colors.white,
  },
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
  clearBtn: {
    padding: spacing.sm,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnDisabled: {
    backgroundColor: colors.textDisabled,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    flex: 1,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.md,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  resultHeaderText: {
    ...typography.label,
    color: colors.primary,
  },
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
  priceLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metaLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  printBtnText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
    textAlign: 'center',
  },
});
