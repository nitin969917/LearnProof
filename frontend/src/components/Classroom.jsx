import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  PlayCircle,
  Play,
  ArrowLeft,
  CheckCircle,
  Clock,
  BookOpen,
  MessageSquare,
  FileText,
  Send,
  User,
  Sparkles,
  Image as ImageIcon,
  X,
  Reply,
  Trash2,
  ChevronRight
} from "lucide-react";
import { useModal } from "../context/ModalContext";
import YouTube from 'react-youtube';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { motion } from "framer-motion";

const Classroom = () => {
  const { user, token, loading: authLoading } = useAuth();
  const { confirm } = useModal();
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [player, setPlayer] = useState(null);
  const [playerError, setPlayerError] = useState(false);
  const [liveProgress, setLiveProgress] = useState(0);
  const [hasSeeked, setHasSeeked] = useState(false);

  // Track continuous progress to avoid spamming the backend
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  // Tabs State
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState("");
  const [noteFiles, setNoteFiles] = useState([]); // Saved files from server
  const [newNoteFiles, setNewNoteFiles] = useState([]); // Pending files to upload
  const [deletedFileIds, setDeletedFileIds] = useState([]); // IDs of server files marked for deletion
  const [previewFile, setPreviewFile] = useState(null); // File to show in popup modal
  const [savingNote, setSavingNote] = useState(false);
  const latestProgressRef = useRef(0);
  const activeVideoRef = useRef(null); // Ref for auto-scrolling

  // Playlist Pagination State
  const [playlistPage, setPlaylistPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  useEffect(() => {
    latestProgressRef.current = liveProgress;
  }, [liveProgress]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // ID of comment being replied to

  const [intuitionContent, setIntuitionContent] = useState("");
  const [modelName, setModelName] = useState("");
  const [loadingIntuition, setLoadingIntuition] = useState(false);
  const [intuitionCountdown, setIntuitionCountdown] = useState(15);

  // Quiz State
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 min
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  // Quiz History:
  // - Attempted Quiz History: Submitting a quiz stores exactly what the user selected in the database.
  // - Immediate Review: Added an immediate "Review Answers" button after submission so users can check correct answers without leaving the results screen.
  // - History List: Both the Dashboard and Classroom Video Quiz tab display a list of "Previous Attempts" (filtered for the specific video), which users can click to see a detailed, interactive test review.
  const [quizHistory, setQuizHistory] = useState([]);
  const [selectedHistoryQuiz, setSelectedHistoryQuiz] = useState(null);

  const fetchDiscussionData = async () => {
    try {
      const noteRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/video-note/?idToken=${token}&videoId=${videoId}`);
      setNoteContent(noteRes.data.content || "");
      if (noteRes.data.files && noteRes.data.files.length > 0) {
        setNoteFiles(noteRes.data.files.map(f => ({
          id: f.id,
          url: f.file.startsWith('http') ? f.file : `${import.meta.env.VITE_BACKEND_URL}/${f.file}`,
          name: f.original_name || f.file.split('/').pop()
        })));
      } else {
        setNoteFiles([]);
      }

      const commentRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/video-comment/?idToken=${token}&videoId=${videoId}`);
      setComments(commentRes.data || []);
    } catch (err) {
      console.error("Failed to fetch notes or comments", err);
    }
  };

  const fetchIntuition = async () => {
    if (intuitionContent) return; // Already fetched
    setLoadingIntuition(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/video-intuition/?idToken=${token}&videoId=${videoId}`);
      setIntuitionContent(res.data.content);
      setModelName(res.data.model_name || "");
    } catch (err) {
      console.error("Failed to fetch intuition", err);
      toast.error("Failed to generate intuition.");
    } finally {
      setLoadingIntuition(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/quiz-history/?idToken=${token}`);
      // Only keep history relevant to this specific video
      const historyForVideo = res.data.filter(q => {
        // Try all possible matches to be super resilient
        const matchesVid = q.video?.vid && String(q.video.vid) === String(videoId);
        const matchesDbId = video?.id && q.videoId === video.id;
        const matchesRawVid = q.videoId && String(q.videoId) === String(videoId); // Fallback

        return (matchesVid || matchesDbId || matchesRawVid) && q.score !== null;
      });
      setQuizHistory(historyForVideo);
    } catch (err) {
      console.error("Failed to fetch quiz history", err);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-orange-50 dark:bg-gray-900 text-orange-600 dark:text-orange-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xl font-semibold">Resuming session...</span>
        </div>
      </div>
    );
  }

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const formData = new FormData();
      formData.append('idToken', token);
      formData.append('videoId', videoId);
      formData.append('content', noteContent);

      // Append array of new files
      newNoteFiles.forEach(file => {
        formData.append('new_files', file);
      });

      // Append array of deleted file IDs
      if (deletedFileIds.length > 0) {
        formData.append('deleted_file_ids', JSON.stringify(deletedFileIds));
      }

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/video-note/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Sync back down with exact server state
      if (res.data.files) {
        setNoteFiles(res.data.files.map(f => ({
          id: f.id,
          url: f.file.startsWith('http') ? f.file : `${import.meta.env.VITE_BACKEND_URL}/${f.file}`,
          name: f.original_name || f.file.split('/').pop()
        })));
      } else {
        setNoteFiles([]);
      }
      setNewNoteFiles([]); // Clear pending uploads
      setDeletedFileIds([]); // Clear pending deletions

      toast.success("Note saved successfully");
    } catch (err) {
      toast.error("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/video-comment/`, {
        idToken: token,
        videoId: videoId,
        content: newComment,
        parent_id: replyTo // Include parent if replying
      });

      if (replyTo) {
        // Find parent and add reply locally (or just re-fetch)
        // For simplicity and to ensure correct ordering, let's re-fetch or update existing tree
        setComments(comments.map(c => {
          if (c.id === replyTo) {
            return { ...c, replies: [...(c.replies || []), res.data] };
          }
          return c;
        }));
      } else {
        setComments([...comments, res.data]);
      }

      setNewComment("");
      setReplyTo(null);
      toast.success("Comment posted");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const confirmed = await confirm({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment? This cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/video-comment/`, {
        data: { idToken: token, commentId }
      });

      // Remove from state
      const removeNode = (list) => {
        return list
          .filter(c => c.id !== commentId)
          .map(c => ({
            ...c,
            replies: c.replies ? removeNode(c.replies) : []
          }));
      };

      setComments(removeNode(comments));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    }
  };



  useEffect(() => {
    const fetchClassroom = async () => {
      const loader = toast.loading("Loading classroom...");
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/classroom/`,
          {
            idToken: token,
            videoId: videoId,
          }
        );

        setVideo(res.data.video);
        setLiveProgress(res.data.video.watch_progress || 0);
        setLastSavedProgress(res.data.video.watch_progress || 0);
        setHasSeeked(false);
        setPlaylist(res.data.playlist);
        toast.success("Classroom loaded", { id: loader });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load classroom", { id: loader });
      } finally {
        setLoading(false);
      }
    };
    if (token && videoId) {
      setIntuitionContent(""); // Clear previous intuition when video changes
      setQuizData(null);
      setQuizResult(null);
      setQuizHistory([]);
      setSelectedHistoryQuiz(null);
      setPlayerError(false); // Reset player error on video change
      fetchClassroom();
      fetchDiscussionData();

      // On mobile, default to playlist tab if available
      if (window.innerWidth < 1024) {
        setActiveTab('playlist');
      }
    }
  }, [token, videoId]);

  // Sync pagination with active video
  useEffect(() => {
    if (playlist?.videos?.length > 0 && videoId) {
      const vIndex = playlist.videos.findIndex(v => v.vid === videoId);
      if (vIndex !== -1) {
        const pageOfVideo = Math.floor(vIndex / ITEMS_PER_PAGE) + 1;
        setPlaylistPage(pageOfVideo);
      }
    }
  }, [playlist, videoId]);

  // Auto-scroll to the active video in the playlist
  useEffect(() => {
    if (activeVideoRef.current) {
      activeVideoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [videoId, activeTab, playlist]);

  // Fetch intuition only when the tab is opened
  useEffect(() => {
    if (activeTab === 'intuition') {
      fetchIntuition();
    }
    if (activeTab === 'quiz') {
      fetchQuizHistory();
    }
  }, [activeTab, token, videoId, video]);

  // Intuition Generation Countdown
  useEffect(() => {
    let interval;
    if (loadingIntuition) {
      setIntuitionCountdown(15);
      interval = setInterval(() => {
        setIntuitionCountdown(prev => (prev > 1 ? prev - 1 : 1));
      }, 1000);
    } else {
      setIntuitionCountdown(15);
    }
    return () => clearInterval(interval);
  }, [loadingIntuition]);

  // Quiz Timer
  useEffect(() => {
    if (!quizData) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitQuiz(); // auto-submit when time runs out
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizData]);

  const handleStartQuiz = async () => {
    setLoadingQuiz(true);
    setQuizResult(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/start-quiz/`, {
        idToken: token,
        contentType: 'video',
        contentId: videoId,
      });
      toast.dismiss();
      setQuizData(res.data.quiz);
      setAnswers({});
      setTimeLeft(res.data.quiz.time_limit * 60); // Use time_limit from backend (convert to seconds)
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to start quiz. Check your connection.";
      
      if (err.response?.status === 403) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleQuizAnswer = (qIdx, value) => {
    setAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    setSubmittingQuiz(true);
    try {
      const answerList = (quizData?.questions || []).map((_, idx) => answers[idx] || "");
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/submit-quiz/`, {
        idToken: token,
        quizId: quizData.quiz_id,
        answers: answerList,
      });
      setQuizResult(res.data);
      await fetchQuizHistory();
      toast.success("Quiz submitted!");
      setQuizData(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const markAsCompleted = async () => {
    if (!video) return;
    setMarking(true);
    const loader = toast.loading("Marking as completed...");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/mark-completed/`, {
        idToken: token,
        videoId: video.vid,
      });
      toast.success("Marked as completed", { id: loader });
      setVideo({ ...video, watch_progress: 100, is_completed: true });
      setLiveProgress(100);
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as completed", { id: loader });
    } finally {
      setMarking(false);
    }
  };

  const unmarkAsCompleted = async () => {
    if (!video) return;
    setMarking(true);
    const loader = toast.loading("Unmarking as completed...");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/unmark-completed/`, {
        idToken: token,
        videoId: video.vid,
      });
      toast.success("Unmarked", { id: loader });
      setVideo({ ...video, watch_progress: 0, is_completed: false });
      setLiveProgress(0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to unmark", { id: loader });
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => {
    let interval;
    if (player && video) {
      interval = setInterval(async () => {
        try {
          const currentTime = await player.getCurrentTime();
          const duration = await player.getDuration();

          if (duration > 0) {
            const percentRaw = (currentTime / duration) * 100;
            const percentage = Math.round(percentRaw);

            setLiveProgress(percentage);

            // Only save to backend every 2% changes or if it reached >95%
            if (percentage > lastSavedProgress + 2 || (percentage > 95 && lastSavedProgress <= 95)) {
              console.log("Saving progress to backend:", percentage);
              setLastSavedProgress(percentage);

              if (percentage >= 95 && !video.is_completed) {
                // Auto-mark completed
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/mark-completed/`, {
                  idToken: token,
                  videoId: video.vid,
                });
                setVideo(prev => ({ ...prev, watch_progress: 100, is_completed: true }));
              } else {
                // Just update partial progress
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/update-progress/`, {
                  idToken: token,
                  videoId: video.vid,
                  progress: percentage
                });
                setVideo(prev => ({ ...prev, watch_progress: percentage }));
              }
            }
          }
        } catch (err) {
          // Ignore player errors during unmounts/loading
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      clearInterval(interval);
      // Final save on unmount/video change if progress changed
      if (latestProgressRef?.current > lastSavedProgress) {
        axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/update-progress/`, {
          idToken: token,
          videoId: video?.vid,
          progress: latestProgressRef.current
        }).catch(() => { });
      }
    };
  }, [player, video, lastSavedProgress, token]);

  const handlePlayerStateChange = async (event) => {
    // YT.PlayerState.PLAYING is 1
    if (event.data === 1 && !hasSeeked && video?.watch_progress > 0 && video?.watch_progress < 98) {
      setHasSeeked(true);
      const duration = await event.target.getDuration();
      if (duration > 0) {
        const seekSeconds = (video.watch_progress / 100) * duration;
        event.target.seekTo(seekSeconds);
        setLastSavedProgress(video.watch_progress);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-orange-500 mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
          <p className="text-lg text-gray-700 font-medium">Loading classroom...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait while we prepare your content</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Video Not Found</h2>
          <p className="text-gray-600">The requested video could not be loaded.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto lg:h-screen lg:overflow-hidden">
        {/* Premium Header */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 shadow-sm transition-colors duration-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
            <button
              onClick={() => navigate("/dashboard")}
              className="group flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-orange-500 text-sm font-black uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Live progress chip */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">{Math.round(liveProgress)}% watched</span>
              </div>

              <button
                onClick={video.is_completed ? unmarkAsCompleted : markAsCompleted}
                disabled={marking}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                  video.is_completed
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100'
                    : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30'
                }`}
              >
                {marking ? (
                  <div className={`animate-spin rounded-full h-4 w-4 border-2 ${video.is_completed ? 'border-green-500 border-t-transparent' : 'border-white border-t-transparent'}`}></div>
                ) : (
                  <CheckCircle size={14} />
                )}
                <span className="hidden sm:inline">
                  {video.is_completed ? 'Completed ✓' : 'Mark as Done'}
                </span>
                <span className="sm:hidden">
                  {video.is_completed ? '✓' : 'Done'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 lg:overflow-y-auto w-full max-w-full bg-white dark:bg-gray-900 transition-colors duration-200">
          {/* Enhanced Video Player */}
          <div className="bg-black relative shadow-2xl aspect-video w-full flex items-center justify-center shrink-0">
            <YouTube
              key={video.vid}
              videoId={video.vid}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
                  playsinline: 1,
                  rel: 0
                }
              }}
              className="absolute top-0 left-0 w-full h-full"
              containerClassName="w-full h-full absolute inset-0"
              onReady={(e) => { setPlayer(e.target); setPlayerError(false); }}
              onStateChange={handlePlayerStateChange}
              onError={() => setPlayerError(true)}
            />
            {/* Fallback overlay when YouTube blocks embedding */}
            {playerError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-gray-950 text-white text-center px-6">
                <div className="p-5 bg-red-500/10 rounded-full border border-red-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <h3 className="text-xl font-black mb-2">Embedding Restricted</h3>
                  <p className="text-gray-400 text-sm max-w-sm">The video owner has disabled embedded playback. You can still watch this video directly on YouTube.</p>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${video.vid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-8 py-3.5 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-700 transition-all hover:scale-105 shadow-2xl shadow-red-500/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  Watch on YouTube
                </a>
              </div>
            )}
          </div>

          {/* Video Details */}
          <div className="bg-white dark:bg-gray-900 flex-1 min-w-0 transition-colors duration-200">
            <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-20 lg:pb-6">
              <h1 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white mb-3 leading-tight">{video.name}</h1>

              {/* Progress Bar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(liveProgress)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-2 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                  />
                </div>
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest min-w-fit">
                  {Math.round(liveProgress)}%
                </span>
              </div>

              {/* Premium Tabs */}
              <div className="mt-4">
                <div className="flex bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-1.5 gap-1 overflow-x-auto hide-scrollbar border border-gray-100 dark:border-slate-700/50">
                  {[
                    { id: 'playlist', label: 'Playlist', icon: PlayCircle, hideOnDesktop: true },
                    { id: 'overview', label: 'Overview', icon: BookOpen },
                    { id: 'intuition', label: 'Intuition', icon: Sparkles },
                    { id: 'quiz', label: 'Quiz', icon: CheckCircle },
                    { id: 'notes', label: 'Notes', icon: FileText },
                    { id: 'discussion', label: `Chat (${comments.length})`, icon: MessageSquare },
                  ].filter(t => !t.hideOnDesktop || window.innerWidth < 1024).map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                            : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                        }`}
                      >
                        <Icon size={13} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="py-6">
                  {activeTab === 'playlist' && playlist && (() => {
                    const allVideos = playlist.videos || [];
                    const totalPages = Math.ceil(allVideos.length / ITEMS_PER_PAGE);
                    const paginatedVideos = allVideos.slice((playlistPage - 1) * ITEMS_PER_PAGE, playlistPage * ITEMS_PER_PAGE);

                    return (
                      <div className="lg:hidden space-y-4">
                        <div className="space-y-1 divide-y divide-gray-50 dark:divide-slate-800/50">
                          {paginatedVideos.map((v, index) => {
                            const absoluteIndex = (playlistPage - 1) * ITEMS_PER_PAGE + index;
                            const isActive = v.vid === videoId;
                            const progress = Math.round(isActive ? liveProgress : (v.watch_progress || 0));
                            return (
                              <div
                                key={v.vid}
                                ref={isActive ? activeVideoRef : null}
                                onClick={() => navigate(`/classroom/${v.vid}`)}
                                className={`group flex gap-3 p-3 cursor-pointer transition-all duration-200 rounded-xl ${
                                  isActive
                                    ? 'bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-200 dark:ring-orange-900/50'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                                }`}
                              >
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={`https://img.youtube.com/vi/${v.vid}/default.jpg`}
                                    alt={v.name}
                                    className={`w-20 h-12 object-cover rounded-lg shadow-sm ${isActive ? 'ring-2 ring-orange-400' : ''}`}
                                  />
                                  <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-gray-800 dark:bg-slate-700 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm">
                                    {absoluteIndex + 1}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className={`text-xs font-bold line-clamp-2 mb-1 leading-snug ${isActive ? 'text-orange-600' : 'text-gray-700 dark:text-slate-300'}`}>
                                    {v.name}
                                  </h3>
                                  <div className="h-1 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div style={{ width: `${progress}%` }} className={`h-1 rounded-full ${v.is_completed ? 'bg-green-500' : 'bg-orange-500'}`} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button
                              disabled={playlistPage === 1}
                              onClick={() => setPlaylistPage(p => p - 1)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-orange-500 transition-colors"
                            >
                              <ArrowLeft size={14} /> Previous
                            </button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                              Page {playlistPage} of {totalPages}
                            </span>
                            <button
                              disabled={playlistPage === totalPages}
                              onClick={() => setPlaylistPage(p => p + 1)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-orange-500 transition-colors"
                            >
                              Next <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="prose max-w-none break-words overflow-hidden">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base whitespace-pre-line break-words">
                        {video.description || "No description available for this video."}
                      </p>
                    </div>
                  )}

                  {/* Intuition Tab */}
                  {activeTab === 'intuition' && (
                    <div className="prose max-w-none bg-indigo-50/50 dark:bg-indigo-900/20 p-4 sm:p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 transition-colors duration-200 break-words overflow-hidden">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-200 dark:border-indigo-800">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                          <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 m-0">AI Intuition</h3>
                          <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80 m-0 mt-1">
                            {modelName ? `Powered by ${modelName}` : "Powered by AI"} · Core concepts explained simply
                          </p>
                        </div>
                      </div>

                      {loadingIntuition ? (
                        <div className="flex flex-col items-center justify-center py-12 text-indigo-400">
                          <div className="relative mb-6">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-600 text-lg">
                              {intuitionCountdown}
                            </div>
                          </div>
                          <p className="font-medium animate-pulse text-indigo-600 dark:text-indigo-400">Generating brilliant insights...</p>
                          <p className="text-xs text-indigo-500/60 mt-2">Our AI is analyzing the video content for you</p>
                        </div>
                      ) : (
                        <div className="text-gray-800 dark:text-gray-300 leading-relaxed intuition-markdown">
                          {intuitionContent
                            ? <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                h3: ({ node, ...props }) => <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mt-6 mb-3 break-words" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-gray-100 break-words" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                li: ({ node, ...props }) => <li className="text-gray-700 dark:text-gray-300 break-words" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 text-gray-800 dark:text-gray-300 break-words" {...props} />,
                                pre: ({ node, ...props }) => <div className="overflow-x-auto my-4 p-4 rounded-xl bg-gray-900/5 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-700/50 font-mono text-sm leading-relaxed"><pre className="whitespace-pre" {...props} /></div>,
                                code: ({ node, inline, ...props }) => inline
                                  ? <code className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-semibold text-sm break-all" {...props} />
                                  : <code className="break-all" {...props} />,
                                table: ({ node, ...props }) => <div className="overflow-x-auto my-6"><table className="w-full text-sm text-left border-collapse border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" {...props} /></div>,
                                thead: ({ node, ...props }) => <thead className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 uppercase text-xs font-semibold" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50" {...props} />,
                                tr: ({ node, ...props }) => <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors" {...props} />,
                                th: ({ node, ...props }) => <th className="px-4 py-3 border border-gray-200 dark:border-gray-700/50" {...props} />,
                                td: ({ node, ...props }) => <td className="px-4 py-3 border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 break-words" {...props} />
                              }}
                            >
                              {intuitionContent}
                            </ReactMarkdown>
                            : "No intuition could be generated for this video."}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Tab */}
                  {activeTab === 'quiz' && (
                    <div className="prose max-w-none bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-800 transition-colors duration-200">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                            <CheckCircle className="text-orange-600 dark:text-orange-400" size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100 m-0">Video Quiz</h3>
                              {quizHistory.some(h => h.passed) && (
                                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle size={10} /> Passed
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-orange-600/80 dark:text-orange-400/80 m-0 mt-1">Test your knowledge to unlock playlist certification.</p>
                          </div>
                        </div>
                      </div>

                      {selectedHistoryQuiz ? (() => {
                        const questions = JSON.parse(selectedHistoryQuiz.questions);
                        const userAnswers = selectedHistoryQuiz.user_answers ? JSON.parse(selectedHistoryQuiz.user_answers) : [];

                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 relative"
                          >
                            <button
                              onClick={() => setSelectedHistoryQuiz(null)}
                              className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <ArrowLeft size={16} /> Back to Quiz Menu
                            </button>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b dark:border-slate-700 pb-6 gap-4">
                              <div>
                                <h2 className="text-2xl font-bold dark:text-white m-0 mt-0">Detailed Review</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 m-0">
                                  Attempted: {new Date(selectedHistoryQuiz.attempted_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-left sm:text-right bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${selectedHistoryQuiz.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                  {selectedHistoryQuiz.passed ? "Passed" : "Failed"}
                                </span>
                                <p className="text-lg font-bold m-0 dark:text-slate-200 leading-tight">Score: {selectedHistoryQuiz.score}%</p>
                              </div>
                            </div>

                            <div className="space-y-8">
                              {(questions || []).map((q, idx) => {
                                const userAnswer = userAnswers[idx];
                                const isCorrect = userAnswer === q.answer;

                                return (
                                  <div key={idx} className="pb-8 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                                    <p className="font-semibold text-lg text-gray-800 dark:text-slate-200 mb-4 leading-relaxed"><span className="text-orange-500 mr-2">{idx + 1}.</span> {q.question}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {(q.options || []).map((opt, optIdx) => {
                                        const isSelected = opt === userAnswer;
                                        const isActualAnswer = opt === q.answer;

                                        let bgClass = "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600";
                                        if (isSelected && isCorrect) bgClass = "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300 ring-1 ring-green-500";
                                        else if (isSelected && !isCorrect) bgClass = "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300 ring-1 ring-red-500";
                                        else if (isActualAnswer) bgClass = "bg-green-50/50 dark:bg-green-900/10 border-green-300 text-green-700 dark:text-green-400 border-dashed";

                                        return (
                                          <div key={optIdx} className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-center ${bgClass}`}>
                                            <span className="text-sm font-medium leading-snug">{opt}</span>
                                            <div className="mt-2 flex items-center gap-1.5 opacity-90">
                                              {isSelected && isCorrect && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Your Correct Answer</span>}
                                              {isSelected && !isCorrect && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><X size={12} /> Your Incorrect Answer</span>}
                                              {!isSelected && isActualAnswer && <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} /> Correct Answer</span>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        );
                      })()
                        : quizResult ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded shadow max-w-md mx-auto text-center border dark:border-slate-700"
                          >
                            <h2 className="text-xl font-bold mb-2 dark:text-white mt-0">{quizResult.passed ? "🎉 Congratulations!" : "Better luck next time!"}</h2>
                            <p className="mb-4 dark:text-slate-300">Your Score: {quizResult.score}%</p>
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => setSelectedHistoryQuiz(quizResult.quiz)}
                                className="w-full px-4 py-2.5 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition shadow-sm cursor-pointer"
                              >
                                Review Answers
                              </button>
                              <button
                                onClick={() => {
                                  setQuizResult(null);
                                  fetchQuizHistory();
                                }}
                                className="w-full px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition cursor-pointer"
                              >
                                Close Results
                              </button>
                            </div>
                          </motion.div>
                        ) : quizData ? (
                          <div className="bg-white dark:bg-slate-800 rounded shadow p-6 border dark:border-slate-700 relative">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-xl font-semibold dark:text-white m-0">Quiz</h2>
                              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 m-0">Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
                            </div>
                            {quizData?.questions?.map && quizData.questions.map((q, idx) => (
                              <div key={idx} className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:mb-0">
                                <p className="font-medium text-gray-800 dark:text-slate-200 mb-3 text-lg leading-relaxed">{idx + 1}. {q.question}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {(q.options || []).map((opt, optIdx) => (
                                    <label key={optIdx} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${answers[idx] === opt
                                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                      : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                                      }`}>
                                      <input
                                        type="radio"
                                        name={`question-${idx}`}
                                        value={opt}
                                        checked={answers[idx] === opt}
                                        onChange={() => handleQuizAnswer(idx, opt)}
                                        className="mt-1 w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                      />
                                      <span className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                              <button
                                disabled={submittingQuiz}
                                onClick={() => {
                                  setQuizData(null);
                                  toast("Quiz cancelled.");
                                }}
                                className="px-6 py-2.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                disabled={submittingQuiz}
                                onClick={handleSubmitQuiz}
                                className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                              >
                                {submittingQuiz ? "Submitting..." : "Submit Answers"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center w-full">
                            <CheckCircle className="text-orange-400/50 mb-4 h-16 w-16" />
                            <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Ready to test your knowledge?</h4>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">Take a 10-question quiz generated by AI specifically for this video to earn XP!</p>
                            <button
                              onClick={handleStartQuiz}
                              disabled={loadingQuiz}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {loadingQuiz ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  Generating Quiz...
                                </>
                              ) : "Start Quiz Now"}
                            </button>

                            {quizHistory.length > 0 && (
                              <div className="mt-16 w-full max-w-2xl mx-auto text-left">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b dark:border-gray-700 pb-3">
                                  <Clock size={20} className="text-orange-500" /> Previous Attempts
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                  {(quizHistory || []).map(hist => (
                                    <motion.div
                                      key={hist.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      onClick={() => setSelectedHistoryQuiz(hist)}
                                      className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-md transition-all group"
                                    >
                                      <div>
                                        <p className="font-semibold text-gray-800 dark:text-slate-200 m-0 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                          Attempt on {new Date(hist.attempted_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className={`inline-block px-3 py-1 text-sm font-bold rounded-lg ${hist.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                          {hist.score}%
                                        </span>
                                        <ArrowLeft size={18} className="text-gray-400 rotate-180 group-hover:text-orange-500 transition-colors" />
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20 flex items-start gap-3">
                        <FileText className="text-orange-500 dark:text-orange-400 mt-0.5" size={20} />
                        <div>
                          <h4 className="font-semibold text-orange-800 dark:text-orange-300">Private Notes</h4>
                          <p className="text-sm text-orange-600/80 dark:text-orange-400/80">These notes are visible only to you. Take down important concepts here.</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl mb-12 quill-container relative z-10 pb-12">
                        <ReactQuill
                          theme="snow"
                          value={noteContent}
                          onChange={setNoteContent}
                          placeholder="Type your notes here... (Auto-saves on save button click)"
                          className="h-64 text-gray-800 dark:text-gray-200"
                        />
                      </div>

                      {/* Handwritten Notes Uploader */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="text-gray-500 dark:text-gray-400" size={20} />
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Handwritten Notes</h4>
                          </div>
                          <label className="cursor-pointer bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setNewNoteFiles([...newNoteFiles, ...Array.from(e.target.files)]);
                                }
                              }}
                            />
                            Upload Files
                          </label>
                        </div>

                        {/* File Previews */}
                        <div className="space-y-3 mb-4">
                          {/* Render Server Files */}
                          {noteFiles.map((file) => (
                            <div key={file.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-full">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="text-orange-500 shrink-0" size={24} />
                                <div className="flex flex-col truncate">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {(file.name.toLowerCase().endsWith(".pdf")) ? "PDF Document" : "Image File"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setPreviewFile({ url: file.url, name: file.name })}
                                  className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                                >
                                  View Full Size
                                </button>
                                <button
                                  onClick={() => {
                                    setDeletedFileIds([...deletedFileIds, file.id]);
                                    setNoteFiles(noteFiles.filter(f => f.id !== file.id));
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                  title="Remove Saved File"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Render Unsaved New Files */}
                          {newNoteFiles.map((file, idx) => (
                            <div key={`new-${idx}`} className="flex items-center justify-between bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-900 rounded-lg p-3 w-full shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="text-blue-500 shrink-0" size={24} />
                                <div className="flex flex-col truncate">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-blue-500 dark:text-blue-400">
                                    Unsaved {(file.type === "application/pdf") ? "PDF Document" : "Image File"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setPreviewFile({ url: URL.createObjectURL(file), name: file.name })}
                                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
                                >
                                  View Preview
                                </button>
                                <button
                                  onClick={() => {
                                    const newArr = [...newNoteFiles];
                                    newArr.splice(idx, 1);
                                    setNewNoteFiles(newArr);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                  title="Remove Pending File"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          className="bg-gray-900 dark:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                          {savingNote ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : "Save Notes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Discussion Tab */}
                  {activeTab === 'discussion' && (
                    <div className="flex flex-col h-[500px] bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                        {comments.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare size={48} className="mb-2 opacity-20" />
                            <p>No messages yet. Start the discussion!</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              const renderComment = (comment, isReply = false) => (
                                <div key={comment.id} className={`flex flex-col ${isReply ? 'ml-11 mt-3' : ''}`}>
                                  <div className="flex gap-3 animate-fade-in group">
                                    {comment.user_picture ? (
                                      <img src={comment.user_picture} alt="User" className="w-8 h-8 rounded-full shadow-sm shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs shadow-sm shrink-0">
                                        {comment.user_name?.charAt(0) || 'U'}
                                      </div>
                                    )}
                                    <div className="flex flex-col max-w-[85%]">
                                      <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{comment.user_name || 'Anonymous'}</span>
                                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                          {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                      </div>
                                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap relative">
                                        {comment.content}

                                        {/* Actions */}
                                        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => setReplyTo(comment.id)}
                                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                                            title="Reply"
                                          >
                                            <Reply size={14} />
                                          </button>
                                          {user?.uid === comment.user_uid && (
                                            <button
                                              onClick={() => handleDeleteComment(comment.id)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                              title="Delete"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Render Replies */}
                                  {comment.replies && (comment.replies || []).map(reply => renderComment(reply, true))}
                                </div>
                              );
                              return (comments || []).map(c => renderComment(c));
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        {replyTo && (
                          <div className="mb-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-between animate-fade-in">
                            <span className="text-xs text-orange-700 flex items-center gap-1">
                              <Reply size={12} /> Replying to <strong>{comments.find(c => c.id === replyTo)?.user_name || 'message'}</strong>
                            </span>
                            <button onClick={() => setReplyTo(null)} className="text-orange-400 hover:text-orange-600 transition-colors">
                              <X size={14} />
                            </button>
                          </div>
                        )}
                        <form onSubmit={(e) => { e.preventDefault(); handlePostComment(); }} className="flex items-center gap-2 relative">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={replyTo ? "Write a reply..." : "Message the community..."}
                            className="flex-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-600 rounded-full py-3 px-5 pr-12 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                            autoFocus={!!replyTo}
                          />
                          <button
                            type="submit"
                            disabled={postingComment || !newComment.trim()}
                            className="absolute right-2 top-1.5 bottom-1.5 w-9 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-gray-300"
                          >
                            {postingComment ? (
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            ) : (
                              <Send size={16} className="-ml-0.5" />
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Playlist Sidebar */}
      {playlist && (
        <div className="hidden lg:flex w-full lg:w-80 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-slate-800 lg:h-screen lg:overflow-hidden flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-orange-500 text-white rounded-lg">
                <PlayCircle size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Playlist</span>
            </div>
            <h2 className="text-sm font-black text-gray-800 dark:text-white line-clamp-2 leading-snug">{playlist.name}</h2>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
              {(playlist.videos || []).length} lessons
            </p>
          </div>

          {/* Video List */}
          {(() => {
            const allVideos = playlist.videos || [];
            const totalPages = Math.ceil(allVideos.length / ITEMS_PER_PAGE);
            const paginatedVideos = allVideos.slice((playlistPage - 1) * ITEMS_PER_PAGE, playlistPage * ITEMS_PER_PAGE);

            return (
              <>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800">
                  {paginatedVideos.map((v, index) => {
                    const absoluteIndex = (playlistPage - 1) * ITEMS_PER_PAGE + index;
                    const isActive = v.vid === videoId;
                    const progress = Math.round(isActive ? liveProgress : (v.watch_progress || 0));
                    return (
                      <div
                        key={v.vid}
                        ref={isActive ? activeVideoRef : null}
                        onClick={() => navigate(`/classroom/${v.vid}`)}
                        className={`group flex gap-3 p-3 cursor-pointer transition-all duration-200 ${isActive
                          ? 'bg-orange-50 dark:bg-orange-900/10 border-r-2 border-orange-500'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={`https://img.youtube.com/vi/${v.vid}/default.jpg`}
                            alt={v.name}
                            className={`w-20 h-12 object-cover rounded-xl shadow-sm transition-all ${isActive ? 'ring-2 ring-orange-400' : ''}`}
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-orange-500/30 rounded-xl flex items-center justify-center">
                              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                <Play size={10} className="text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                          {v.is_completed && !isActive && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle size={10} className="text-white fill-white" />
                            </div>
                          )}
                          <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 bg-gray-800 dark:bg-slate-700 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm">
                            {absoluteIndex + 1}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xs font-bold line-clamp-2 mb-1.5 leading-snug transition-colors ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-slate-300 group-hover:text-orange-500'
                            }`}>
                            {v.name}
                          </h3>
                          {/* Progress bar */}
                          <div className="h-1 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progress}%` }}
                              className={`h-1 rounded-full transition-all duration-500 ${v.is_completed ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'
                                }`}
                            ></div>
                          </div>
                          <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">
                            {progress}% watched
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Pagination Footer */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                    <button
                      disabled={playlistPage === 1}
                      onClick={() => setPlaylistPage(p => p - 1)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      Page {playlistPage} of {totalPages}
                    </span>
                    <button
                      disabled={playlistPage === totalPages}
                      onClick={() => setPlaylistPage(p => p + 1)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/40 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setPreviewFile(null)}>
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 truncate pr-4">
                <FileText size={20} className="text-orange-500 shrink-0" />
                <span className="truncate">{previewFile.name}</span>
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              {previewFile.url && previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-full flex flex-col">
                  <iframe
                    src={previewFile.url}
                    className="w-full h-full rounded-lg shadow-sm bg-white dark:bg-gray-800"
                    title="PDF Preview"
                  />
                  <div className="mt-4 text-center">
                    <a
                      href={previewFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                      Open in new tab if preview doesn't load
                    </a>
                  </div>
                </div>
              ) : (
                <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classroom;
