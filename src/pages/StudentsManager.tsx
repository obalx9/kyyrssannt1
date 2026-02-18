import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, UserPlus, Trash2, Calendar, Users, Clock } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ConfirmDialog from '../components/ConfirmDialog';

interface Course {
  id: string;
  title: string;
}

interface Enrollment {
  id: string;
  enrolled_at: string;
  expires_at: string | null;
  student: {
    id: string;
    telegram_id: string;
    first_name: string | null;
    last_name: string | null;
    telegram_username: string | null;
  };
}

interface PendingEnrollment {
  id: string;
  telegram_id: string | null;
  telegram_username: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function StudentsManager() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [telegramIdentifier, setTelegramIdentifier] = useState('');
  const [expiryDays, setExpiryDays] = useState<string>('30');
  const [adding, setAdding] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'student' | 'pending';
    id: string | null;
  }>({ open: false, type: 'student', id: null });

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes('seller'))) {
      navigate('/login');
      return;
    }

    if (user && courseId) {
      loadData();
    }
  }, [user, loading, courseId, navigate]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const courseResponse = await fetch(
        `${supabaseUrl}/rest/v1/courses?id=eq.${courseId}&select=id,title`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!courseResponse.ok) throw new Error('Failed to load course');

      const courseData = await courseResponse.json();
      if (!courseData || courseData.length === 0) {
        alert(t('courseNotFoundAlert'));
        navigate('/seller/dashboard');
        return;
      }
      setCourse(courseData[0]);

      const enrollmentsResponse = await fetch(
        `${supabaseUrl}/rest/v1/course_enrollments?course_id=eq.${courseId}&select=id,enrolled_at,expires_at,student:student_id(id,telegram_id,first_name,last_name,telegram_username)&order=enrolled_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!enrollmentsResponse.ok) throw new Error('Failed to load enrollments');

      const enrollmentsData = await enrollmentsResponse.json();
      setEnrollments(enrollmentsData || []);

      const pendingResponse = await fetch(
        `${supabaseUrl}/rest/v1/pending_enrollments?course_id=eq.${courseId}&select=id,telegram_id,telegram_username,expires_at,created_at&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!pendingResponse.ok) throw new Error('Failed to load pending enrollments');

      const pendingData = await pendingResponse.json();
      setPendingEnrollments(pendingData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(t('failedToLoadData'));
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !user) return;

    setAdding(true);
    try {
      const identifier = telegramIdentifier.trim();
      const isNumeric = /^\d+$/.test(identifier);
      const cleanUsername = identifier.startsWith('@') ? identifier.slice(1) : identifier;

      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert(t('failedToFindStudent') + ': No auth token');
        setAdding(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const queryParam = isNumeric
        ? `telegram_id=eq.${identifier}`
        : `telegram_username=eq.${cleanUsername}`;

      const studentResponse = await fetch(
        `${supabaseUrl}/rest/v1/users?${queryParam}&select=id`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!studentResponse.ok) {
        console.error('Error finding student');
        alert(`${t('failedToFindStudent')}: Failed to query user`);
        setAdding(false);
        return;
      }

      const students = await studentResponse.json();
      const studentData = students && students.length > 0 ? students[0] : null;

      const expiryDaysNum = parseInt(expiryDays) || 0;
      const expiresAt = expiryDaysNum > 0
        ? new Date(Date.now() + expiryDaysNum * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (!studentData) {
        const pendingResponse = await fetch(`${supabaseUrl}/rest/v1/pending_enrollments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            course_id: courseId,
            telegram_id: isNumeric ? identifier : null,
            telegram_username: isNumeric ? null : cleanUsername,
            granted_by: user.id,
            expires_at: expiresAt,
          })
        });

        if (!pendingResponse.ok) {
          console.error('Error creating pending enrollment');
          if (pendingResponse.status === 409) {
            alert(t('invitationAlreadyExists'));
          } else {
            const error = await pendingResponse.text();
            alert(`${t('failedToCreateInvitation')}: ${error}`);
          }
          setAdding(false);
          return;
        }

        alert(t('invitationCreated'));
        setShowAddModal(false);
        setTelegramIdentifier('');
        setExpiryDays('30');
        await loadData();
        return;
      }

      const enrollResponse = await fetch(`${supabaseUrl}/rest/v1/course_enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          course_id: courseId,
          student_id: studentData.id,
          granted_by: user.id,
          expires_at: expiresAt,
        })
      });

      if (!enrollResponse.ok) {
        console.error('Error enrolling student');
        if (enrollResponse.status === 409) {
          alert(t('studentAlreadyEnrolled'));
        } else {
          const error = await enrollResponse.text();
          alert(`${t('failedToEnrollStudent')}: ${error}`);
        }
        setAdding(false);
        return;
      }

      alert(t('studentAddedSuccessfully'));
      setShowAddModal(false);
      setTelegramIdentifier('');
      setExpiryDays('30');
      await loadData();
    } catch (error: any) {
      console.error('Error adding student:', error);
      alert(`${t('failedToAddStudent')}: ${error?.message || t('unknownError')}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/course_enrollments?id=eq.${enrollmentId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to remove student');
      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
    } catch (error) {
      console.error('Error removing student:', error);
      alert(t('failedToRemoveStudent'));
    }
  };

  const handleRemovePendingInvitation = async (pendingId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/pending_enrollments?id=eq.${pendingId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to remove invitation');
      setPendingEnrollments(pendingEnrollments.filter(p => p.id !== pendingId));
    } catch (error) {
      console.error('Error removing pending invitation:', error);
      alert(t('failedToRemoveInvitation'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStudentName = (enrollment: Enrollment) => {
    if (enrollment.student?.first_name || enrollment.student?.last_name) {
      return `${enrollment.student?.first_name || ''} ${enrollment.student?.last_name || ''}`.trim();
    }
    return enrollment.student?.telegram_username || 'Unknown';
  };

  const getInitials = (enrollment: Enrollment) => {
    const name = getStudentName(enrollment);
    return name.slice(0, 2).toUpperCase();
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate(`/seller/course/${courseId}`)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-gray-100" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{t('manageStudents')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{course?.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <button
                onClick={() => setShowAddModal(true)}
                className="hidden sm:flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {t('addStudent')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {enrollments.length === 0 && pendingEnrollments.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('noStudents')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('addStudentDesc')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              {t('addStudent')}
            </button>
          </div>
        ) : (
          <>
            {enrollments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('activeStudents')} ({enrollments.length})</h2>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                          {getInitials(enrollment)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {getStudentName(enrollment)}
                        </div>
                        {enrollment.student?.telegram_username && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">@{enrollment.student.telegram_username}</div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(enrollment.enrolled_at)}
                          </span>
                          {enrollment.expires_at ? (
                            <span className={`flex items-center gap-1 ${isExpired(enrollment.expires_at) ? 'text-red-500 dark:text-red-400' : ''}`}>
                              <Clock className="w-3 h-3" />
                              {formatDate(enrollment.expires_at)}
                              {isExpired(enrollment.expires_at) && ` (${t('expired')})`}
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">{t('lifetime')}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDialog({ open: true, type: 'student', id: enrollment.id })}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <table className="hidden md:table w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('studentColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('telegramIdColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('enrolledColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('expiresColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('actionsColumn')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {getStudentName(enrollment)}
                            </div>
                            {enrollment.student?.telegram_username && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">@{enrollment.student.telegram_username}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {enrollment.student?.telegram_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(enrollment.enrolled_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.expires_at ? (
                            <span
                              className={`inline-flex items-center gap-1 text-sm ${
                                isExpired(enrollment.expires_at)
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              <Calendar className="w-4 h-4" />
                              {formatDate(enrollment.expires_at)}
                              {isExpired(enrollment.expires_at) && ` (${t('expired')})`}
                            </span>
                          ) : (
                            <span className="text-sm text-green-600 dark:text-green-400">{t('lifetime')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setConfirmDialog({ open: true, type: 'student', id: enrollment.id })}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('removeStudent')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pendingEnrollments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('pendingInvitations')} ({pendingEnrollments.length})</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('studentNotRegistered')}</p>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {pendingEnrollments.map((pending) => (
                    <div key={pending.id} className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {pending.telegram_id || (pending.telegram_username ? `@${pending.telegram_username}` : 'Unknown')}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
                          {t('waitingForLogin')}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(pending.created_at)}
                          </span>
                          {pending.expires_at ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(pending.expires_at)}
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">{t('lifetime')}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDialog({ open: true, type: 'pending', id: pending.id })}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <table className="hidden md:table w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('identifierColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('createdColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('expiresColumn')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('actionsColumn')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {pendingEnrollments.map((pending) => (
                      <tr key={pending.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {pending.telegram_id || (pending.telegram_username ? `@${pending.telegram_username}` : 'Unknown')}
                          </div>
                          <div className="text-xs text-yellow-600 dark:text-yellow-400">{t('waitingForLogin')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(pending.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pending.expires_at ? (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              {formatDate(pending.expires_at)}
                            </span>
                          ) : (
                            <span className="text-sm text-green-600 dark:text-green-400">{t('lifetime')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setConfirmDialog({ open: true, type: 'pending', id: pending.id })}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('cancelInvitation')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed bottom-24 right-4 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg shadow-teal-500/30 flex items-center justify-center z-40 active:scale-95 touch-manipulation transition-transform"
      >
        <UserPlus className="w-6 h-6" />
      </button>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('addStudent')}</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('telegramIdOrUsername')} *
                </label>
                <input
                  type="text"
                  value={telegramIdentifier}
                  onChange={(e) => setTelegramIdentifier(e.target.value)}
                  required
                  className="w-full px-4 py-2 text-[16px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder={t('telegramIdPlaceholder')}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('telegramIdHelp')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('accessDuration')}
                </label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 text-[16px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder={t('accessDurationPlaceholder')}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('accessDurationHelp')}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setTelegramIdentifier('');
                    setExpiryDays('30');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={adding || !telegramIdentifier.trim()}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {adding ? t('loading') : t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: 'student', id: null })}
        onConfirm={() => {
          if (confirmDialog.id) {
            if (confirmDialog.type === 'student') {
              handleRemoveStudent(confirmDialog.id);
            } else {
              handleRemovePendingInvitation(confirmDialog.id);
            }
          }
        }}
        title={confirmDialog.type === 'student' ? t('removeStudent') : t('cancelInvitation')}
        message={confirmDialog.type === 'student' ? t('removeStudentConfirm') : t('cancelInvitationConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
      />
    </div>
  );
}
