import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        token: localStorage.getItem('token') || null,
        role: localStorage.getItem('role') || null,
        name: localStorage.getItem('name') || null,
        companyId: localStorage.getItem('companyId') || null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const login = (data) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('name', data.name);
        if (data.companyId) {
            localStorage.setItem('companyId', data.companyId);
        } else {
            localStorage.removeItem('companyId');
        }

        setAuth({
            token: data.token,
            role: data.role,
            name: data.name,
            companyId: data.companyId || null,
        });
    };

    const logout = () => {
        localStorage.clear();
        setAuth({
            token: null,
            role: null,
            name: null,
            companyId: null,
        });
    };

    return (
        <AuthContext.Provider value={{ ...auth, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
