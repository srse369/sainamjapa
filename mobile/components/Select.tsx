import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Modal } from './Modal';
import { Ionicons } from '@expo/vector-icons';

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  style?: ViewStyle;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  required = false,
  error,
  style,
}: SelectProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange(optionValue);
    setShowModal(false);
  };

  const displayValue = options.find(o => o.value === selectedValue)?.label || placeholder;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.selectButton, error && styles.selectError]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.selectText,
          selectedValue ? styles.selectTextSelected : styles.selectTextPlaceholder
        ]}>
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={label}
        actionButton={{ title: 'Done', onPress: () => setShowModal(false), variant: 'secondary' }}
      >
        <View style={styles.optionsList}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                selectedValue === option.value && styles.optionSelected,
              ]}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={[
                styles.optionText,
                selectedValue === option.value && styles.optionTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#0B1220',
    fontFamily: 'Inter_400Regular',
  },
  labelError: {
    color: '#EF4444',
  },
  required: {
    color: '#EF4444',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: '#FBFEFF',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 0,
    elevation: 0,
  },
  selectError: {
    borderColor: '#EF4444',
  },
  selectText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  selectTextSelected: {
    color: '#0B1220',
  },
  selectTextPlaceholder: {
    color: '#6B7280',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  optionsList: {
    maxHeight: 300,
    gap: 8,
  },
  option: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#FBFEFF',
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  optionSelected: {
    backgroundColor: '#EAF3FF',
    borderColor: '#FF6200',
  },
  optionText: {
    fontSize: 14,
    color: '#0B1220',
    fontFamily: 'Inter_400Regular',
  },
  optionTextSelected: {
    color: '#FF6200',
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});