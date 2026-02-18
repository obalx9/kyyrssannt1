import { Home, BookOpen, Bookmark, ExternalLink, Users, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  const pathname = location.pathname;
  const isLoginPage = pathname === '/login' || pathname === '/register-seller';
  if (isLoginPage) return null;

  const isStudent = user.roles.includes('student');
  const isSeller = user.roles.includes('seller');
  const isStudentDashboard = pathname === '/dashboard' || pathname === '/student';
  const isSellerDashboard = pathname === '/seller/dashboard';
  const isStudentCourseView = pathname.startsWith('/course/') && !isSeller;
  const isSellerCourseView = pathname.startsWith('/course/') && isSeller;
  const isSellerCourseEdit = pathname.match(/^\/seller\/course\/[^/]+$/);
  const isStudentsManager = pathname.match(/^\/seller\/course\/[^/]+\/students$/);
  const isAdminPage = pathname === '/admin';

  const courseIdMatch = pathname.match(/\/(?:course|seller\/course)\/([^/]+)/);
  const courseId = courseIdMatch?.[1];

  const handlePinnedPostsClick = () => {
    window.dispatchEvent(new CustomEvent('togglePinnedSidebar'));
  };

  type MenuItem = {
    icon: typeof Home;
    label: string;
    path?: string;
    onClick?: () => void;
    active: boolean;
  };

  const getMenuItems = (): MenuItem[] => {
    const homeItem: MenuItem = {
      icon: Home,
      label: t('navHome'),
      path: isStudent ? '/dashboard' : isSeller ? '/seller/dashboard' : '/admin',
      active: isStudentDashboard || isSellerDashboard || isAdminPage,
    };

    if (isStudentDashboard) {
      return [
        homeItem,
        { icon: BookOpen, label: t('navCourses'), path: '/dashboard', active: true },
      ];
    }

    if (isStudentCourseView) {
      return [
        homeItem,
        { icon: Search, label: t('navSearch'), onClick: () => window.dispatchEvent(new CustomEvent('toggleMobileSearch')), active: false },
        { icon: Bookmark, label: t('navPinned'), onClick: handlePinnedPostsClick, active: false },
      ];
    }

    if (isSellerDashboard) {
      return [
        homeItem,
        { icon: BookOpen, label: t('navCourses'), path: '/seller/dashboard', active: true },
      ];
    }

    if (isSellerCourseEdit && courseId) {
      return [
        homeItem,
        { icon: ExternalLink, label: t('navPreview'), path: `/course/${courseId}`, active: false },
        { icon: Users, label: t('navStudents'), path: `/seller/course/${courseId}/students`, active: false },
      ];
    }

    if (isStudentsManager && courseId) {
      return [
        homeItem,
        { icon: BookOpen, label: t('editCourse'), path: `/seller/course/${courseId}`, active: false },
      ];
    }

    if (isSellerCourseView && courseId) {
      return [
        homeItem,
        { icon: Search, label: t('navSearch'), onClick: () => window.dispatchEvent(new CustomEvent('toggleMobileSearch')), active: false },
        { icon: Bookmark, label: t('navPinned'), onClick: handlePinnedPostsClick, active: false },
      ];
    }

    if (isAdminPage) {
      return [homeItem];
    }

    return [homeItem];
  };

  const menuItems = getMenuItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="mx-3 mb-2">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="flex justify-around items-center h-16 px-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation ${
                    item.active
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.active && (
                    <div className="absolute inset-1 bg-teal-50 dark:bg-teal-900/30 rounded-lg" />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="text-[10px] font-medium mt-0.5 relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
