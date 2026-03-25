import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/Common/ConfirmModal';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const confirm = useCallback((config) => {
        return new Promise((resolve) => {
            setModalConfig({
                ...config,
                isOpen: true,
                onConfirm: () => {
                    setModalConfig(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModalConfig(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ confirm }}>
            {children}
            {modalConfig && (
                <ConfirmModal
                    {...modalConfig}
                />
            )}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
