import React, { useState, useEffect } from 'react';
import { User, Community, Post, Question } from '@/entities/all';
import { ArrowLeft, Search, Users, MessageSquare, FileText, Loader2 } from 'lucide-react';

export default function SearchResultsPage({ query, onBack }) {
  const [results, setResults] = useState({ users: [], communities: [], posts: [], questions: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query && query.trim().length >= 1) {
      performSearch(query.trim());
    }
  }, [query]);

  const performSearch = async (q) => {
    setIsLoading(true);
    const lower = q.toLowerCase();
    try {
      const [allUsers, allCommunities, allPosts, allQuestions] = await Promise.all([
        User.list(undefined, 100),
        Community.filter({ is_approved: true }, '-member_count', 100),
        Post.list('-created_date', 100),
        Question.list('-created_date', 100),
      ]);

      const users = allUsers.filter(u =>
        u.full_name?.toLowerCase().includes(lower)
      );

      const communities = allCommunities.filter(c =>
        c.name?.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower)
      );

      const posts = allPosts.filter(p =>
        p.content?.toLowerCase().includes(lower) ||
        p.tags?.some(tag => tag.toLowerCase().includes(lower))
      );

      const questions = allQuestions.filter(q =>
        q.title?.toLowerCase().includes(lower) ||
        q.content?.toLowerCase().includes(lower)
      );

      setResults({ users, communities, posts, questions });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (email) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'user-profile', email } }));
  };

  const handleCommunityClick = (id) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'community', communityId: id } }));
  };

  const handlePostClick = (id) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'post-detail', postId: id } }));
  };

  const handleQuestionClick = (id) => {
    window.dispatchEvent(new CustomEvent('navigateTo', { detail: { page: 'question-detail', questionId: id } }));
  };

  const totalResults = results.users.length + results.communities.length + results.posts.length + results.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-blue-100 p-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-blue-600" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">"{query}"</span>
        </div>
        {!isLoading && (
          <span className="text-sm text-slate-500">{totalResults} results</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-20 text-slate-500 px-6">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-semibold text-lg">No results found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="px-4 pt-6 space-y-8">

          {/* People */}
          {results.users.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">People</h2>
                <span className="text-sm text-slate-400">({results.users.length})</span>
              </div>
              <div className="space-y-2">
                {results.users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.email)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt={user.full_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {user.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{user.full_name}</p>
                      {user.bio && <p className="text-sm text-slate-500 line-clamp-1">{user.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Communities */}
          {results.communities.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-800">Communities</h2>
                <span className="text-sm text-slate-400">({results.communities.length})</span>
              </div>
              <div className="space-y-2">
                {results.communities.map(community => (
                  <div
                    key={community.id}
                    onClick={() => handleCommunityClick(community.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all"
                  >
                    <img
                      src={community.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=random`}
                      alt={community.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{community.name}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{community.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{community.member_count || 1} members</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {results.posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-bold text-slate-800">Posts</h2>
                <span className="text-sm text-slate-400">({results.posts.length})</span>
              </div>
              <div className="space-y-2">
                {results.posts.map(post => (
                  <div
                    key={post.id}
                    onClick={() => handlePostClick(post.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-green-200 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt={post.author_name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                          {post.author_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <p className="text-sm font-medium text-slate-600">{post.author_name}</p>
                    </div>
                    <p className="text-slate-800 line-clamp-3">{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="w-full h-32 object-cover rounded-lg mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Questions */}
          {results.questions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-bold text-slate-800">Q&A</h2>
                <span className="text-sm text-slate-400">({results.questions.length})</span>
              </div>
              <div className="space-y-2">
                {results.questions.map(question => (
                  <div
                    key={question.id}
                    onClick={() => handleQuestionClick(question.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
                  >
                    <p className="font-semibold text-slate-800 line-clamp-2">{question.title}</p>
                    {question.content && (
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{question.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>by {question.author_name}</span>
                      <span>{question.answers_count || 0} answers</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
}