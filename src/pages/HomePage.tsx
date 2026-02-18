import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import KursatLogo from '../components/KursatLogo';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import {
  BookOpen,
  Users,
  Award,
  Zap,
  DollarSign,
  Clock,
  Star,
  Code,
  Briefcase,
  Palette,
  TrendingUp,
  Globe,
  Music,
  Heart,
  Sparkles,
  Search,
  ArrowRight,
  CheckCircle,
  Send,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const featuredCourses = [
  {
    id: 1,
    title: 'Web Development Mastery',
    description: 'Learn modern web development from scratch',
    category: 'Programming',
    instructor: 'John Smith',
    students: 1250,
    rating: 4.8,
    image: '/images/courses/web-development.svg',
  },
  {
    id: 2,
    title: 'Digital Marketing Complete',
    description: 'Master digital marketing strategies',
    category: 'Marketing',
    instructor: 'Sarah Johnson',
    students: 980,
    rating: 4.9,
    image: '/images/courses/digital-marketing.svg',
  },
  {
    id: 3,
    title: 'UI/UX Design Fundamentals',
    description: 'Create beautiful and functional designs',
    category: 'Design',
    instructor: 'Mike Davis',
    students: 750,
    rating: 4.7,
    image: '/images/courses/ui-ux-design.svg',
  },
  {
    id: 4,
    title: 'Business Strategy & Growth',
    description: 'Scale your business effectively',
    category: 'Business',
    instructor: 'Emily Chen',
    students: 620,
    rating: 4.8,
    image: '/images/courses/business-strategy.svg',
  },
  {
    id: 5,
    title: 'English for Professionals',
    description: 'Improve your business English',
    category: 'Languages',
    instructor: 'David Brown',
    students: 890,
    rating: 4.6,
    image: '/images/courses/english-professionals.svg',
  },
  {
    id: 6,
    title: 'Music Production Pro',
    description: 'Create professional music tracks',
    category: 'Music',
    instructor: 'Alex Martinez',
    students: 540,
    rating: 4.9,
    image: '/images/courses/music-production.svg',
  },
];

export default function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.style.background = 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <KursatLogo className="w-10 h-10" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Kursat
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#courses" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {t('footerCourses')}
              </a>
              <a href="#categories" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {t('categoriesTitle')}
              </a>
              <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {t('testimonialsTitle')}
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <ThemeToggle />
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {t('studentDashboard')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {t('signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600/10 to-cyan-600/10 dark:from-teal-600/20 dark:to-cyan-600/20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                {t('heroTitle')}
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
                {t('heroSubtitle')}
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
                {t('heroDescription')}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                <Link
                  to="/register-seller"
                  className="px-8 py-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 font-semibold"
                >
                  <span>{t('getStarted')}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#courses"
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 border-2 border-teal-600 dark:border-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-gray-700 transition-all transform hover:scale-105 font-semibold"
                >
                  {t('browseCourses')}
                </a>
              </div>

              <div className="relative max-w-4xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="w-full px-6 py-4 pr-32 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-teal-500 dark:focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20 transition-all shadow-lg"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors flex items-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">{t('searchButton')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('statsTitle')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-teal-600 dark:text-teal-400" />
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">500+</div>
                <div className="text-xl text-gray-600 dark:text-gray-300">{t('totalCourses')}</div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
                <Users className="w-16 h-16 mx-auto mb-4 text-cyan-600 dark:text-cyan-400" />
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">10,000+</div>
                <div className="text-xl text-gray-600 dark:text-gray-300">{t('totalStudents')}</div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg transform hover:scale-105 transition-all">
                <Award className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">150+</div>
                <div className="text-xl text-gray-600 dark:text-gray-300">{t('totalInstructors')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('benefitsTitle')}
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-6 flex items-center">
                  <Briefcase className="w-8 h-8 mr-3" />
                  {t('forSellers')}
                </h3>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                        <Zap className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('sellerBenefit1Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('sellerBenefit1Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                        <Send className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('sellerBenefit2Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('sellerBenefit2Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('sellerBenefit3Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('sellerBenefit3Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('sellerBenefit4Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('sellerBenefit4Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-6 flex items-center">
                  <Users className="w-8 h-8 mr-3" />
                  {t('forStudents')}
                </h3>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-lg">
                        <Award className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('studentBenefit1Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('studentBenefit1Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-lg">
                        <Clock className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('studentBenefit2Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('studentBenefit2Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-lg">
                        <Sparkles className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('studentBenefit3Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('studentBenefit3Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-cyan-100 dark:bg-cyan-900/30 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {t('studentBenefit4Title')}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300">
                          {t('studentBenefit4Desc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="courses" className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('featuredCoursesTitle')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('featuredCoursesSubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white dark:bg-gray-700 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={handleImageError}
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-teal-600 text-white text-sm font-semibold rounded-full">
                      {course.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {course.rating}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                        <Users className="w-5 h-5" />
                        <span>{course.students}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {course.instructor}
                      </span>
                      <Link
                        to="/login"
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-semibold"
                      >
                        {t('viewCourse')}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="categories" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('categoriesTitle')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('categoriesSubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Code, name: t('categoryProgramming'), color: 'from-blue-500 to-cyan-500' },
                { icon: Briefcase, name: t('categoryBusiness'), color: 'from-green-500 to-teal-500' },
                { icon: Palette, name: t('categoryDesign'), color: 'from-pink-500 to-rose-500' },
                { icon: TrendingUp, name: t('categoryMarketing'), color: 'from-orange-500 to-yellow-500' },
                { icon: Globe, name: t('categoryLanguages'), color: 'from-purple-500 to-indigo-500' },
                { icon: Music, name: t('categoryMusic'), color: 'from-red-500 to-pink-500' },
                { icon: Heart, name: t('categoryHealth'), color: 'from-teal-500 to-green-500' },
                { icon: Sparkles, name: t('categoryArt'), color: 'from-yellow-500 to-orange-500' },
              ].map((category, index) => (
                <button
                  key={index}
                  className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-center font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t('testimonialsTitle')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('testimonialsSubtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  text: t('testimonial1Text'),
                  author: t('testimonial1Author'),
                  role: t('testimonial1Role'),
                },
                {
                  text: t('testimonial2Text'),
                  author: t('testimonial2Author'),
                  role: t('testimonial2Role'),
                },
                {
                  text: t('testimonial3Text'),
                  author: t('testimonial3Author'),
                  role: t('testimonial3Role'),
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('ctaTitle')}
            </h2>
            <p className="text-xl text-teal-100 mb-8">
              {t('ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register-seller"
                className="px-8 py-4 bg-white text-teal-600 rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg font-semibold"
              >
                {t('ctaSellerButton')}
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-teal-700 text-white border-2 border-white rounded-lg hover:bg-teal-800 transition-all transform hover:scale-105 font-semibold"
              >
                {t('ctaStudentButton')}
              </Link>
            </div>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <KursatLogo className="w-10 h-10" />
                  <span className="text-xl font-bold text-white">Kursat</span>
                </div>
                <p className="text-gray-400">
                  {t('platformTagline')}
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('footerAbout')}</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="hover:text-teal-400 transition-colors">
                      {t('footerAbout')}
                    </a>
                  </li>
                  <li>
                    <a href="#courses" className="hover:text-teal-400 transition-colors">
                      {t('footerCourses')}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('forSellers')}</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/register-seller" className="hover:text-teal-400 transition-colors">
                      {t('becomeSellerLink')}
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="hover:text-teal-400 transition-colors">
                      {t('footerForSellers')}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">{t('footerContact')}</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="hover:text-teal-400 transition-colors">
                      {t('footerContact')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Kursat. {t('footerRights')}
              </p>
              <div className="flex items-center space-x-4">
                <LanguageSelector />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
