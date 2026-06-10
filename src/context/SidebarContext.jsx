import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export const SidebarProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            return false;
        }
        try {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (error) {
            console.warn('Error parsing sidebarOpen from localStorage', error);
            // If parsing fails (e.g. invalid JSON), clear it and default to true
            localStorage.removeItem('sidebarOpen');
            return true;
        }
    });

    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setIsOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
        }
    }, [isOpen, isMobile]);

    const toggleSidebar = () => setIsOpen(prev => !prev);
    const closeSidebar = () => setIsOpen(false);

    return (
        <SidebarContext.Provider value={{ isOpen, isMobile, toggleSidebar, closeSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};
