
import React, { useState, useEffect } from 'react';
import { Question, Answer, User } from '@/entities/all';
import { ArrowLeft, ArrowUp, MessageCircle, MoreVertical, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

export default function QuestionDetailPage({ questionId, onBack }) {
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) { /* Not logged in */ }
    };
    fetchUser();
  }, [questionId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [qData, aData] = await Promise.all([
        Question.get(questionId),
        Answer.filter({ question_id: questionId }, '-created_date'),
      ]);
      setQuestion(qData);
      setAnswers(aData);
    } catch (error) {
      console.error("Error fetching question details", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostAnswer = async () => {
    if (!newAnswer.trim()) return;
    try {
        const user = await User.me();
        await Answer.create({
            question_id: questionId,
            content: newAnswer,
            author_name: user.full_name,
            author_avatar: user.avatar,
            upvotes: 0,
        });
        setNewAnswer('');
        fetchData(); // Refresh data
        toast.success("Answer posted!");
    } catch(e) {
        console.error(e)
        toast.error("Error posting answer.");
    }
  };
  
  const isAdmin = currentUser?.role === 'admin';

  const handleDeleteQuestion = async () => {
    if (!window.confirm("Are you sure you want to delete this question and all its answers? This action cannot be undone.")) {
      return;
    }
    try {
      await Question.delete(questionId);
      toast.success("Question deleted successfully.");
      onBack();
    } catch (err) {
      console.error("Failed to delete question:", err);
      toast.error("Error deleting question. Please try again.");
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Are you sure you want to delete this answer?")) {
      return;
    }
    try {
      await Answer.delete(answerId);
      toast.success("Answer deleted successfully.");
      fetchData(); // Refresh answers
    } catch (err) {
      console.error("Failed to delete answer:", err);
      toast.error("Error deleting answer. Please try again.");
    }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-screen bg-blue-50">
            <p className="text-lg text-slate-700">Loading question details...</p>
        </div>
    );
  }

  if (!question) {
    return (
        <div className="flex justify-center items-center h-screen bg-blue-50">
            <p className="text-lg text-slate-700">Question not found.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-blue-100 flex items-center">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 ml-4 truncate flex-1">{question.title}</h1>
        {isAdmin && (
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDeleteQuestion} className="text-red-500 focus:bg-red-50 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Question
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Question */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{question.title}</h2>
          <p className="text-slate-700 leading-relaxed mb-4">{question.content}</p>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>by {question.author_name}</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <ArrowUp className="w-4 h-4"/>
                <span>{question.upvotes}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4"/>
                <span>{answers.length} Answers</span>
              </span>
            </div>
          </div>
        </div>

        {/* Post Answer */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-bold mb-2">Your Answer</h3>
            <Textarea 
                placeholder="Write your answer here..."
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                rows={4}
            />
            <div className="text-right mt-2">
                <Button onClick={handlePostAnswer}>Post Answer</Button>
            </div>
        </div>

        {/* Answers */}
        <div className="space-y-4">
            {answers.map(answer => (
                 <div key={answer.id} className="bg-white p-4 rounded-xl shadow-sm flex items-start space-x-3 group">
                    <div>
                        <img src={answer.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(answer.author_name || 'N/A')}&background=random&size=40`} className="w-10 h-10 rounded-full object-cover" alt={`${answer.author_name}'s avatar`} />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold">{answer.author_name}</p>
                        <p className="text-slate-700 mt-1">{answer.content}</p>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteAnswer(answer.id)}
                        className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Answer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                 </div>
            ))}
            {answers.length === 0 && !isLoading && (
                <div className="text-center text-slate-500 py-8">
                    No answers yet. Be the first to answer!
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
