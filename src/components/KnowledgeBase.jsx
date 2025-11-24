import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Tag,
  Calendar,
  Clock,
  User,
  Eye,
  Filter,
  Grid,
  List,
  ChevronRight,
  Star,
  TrendingUp,
  BookMarked,
  Plus,
  Edit,
  Trash2,
  Settings,
  BarChart3,
  FileText,
  FolderOpen,
  Hash,
  Save,
  X,
  Upload,
  Image,
  Bold,
  Italic,
  Link,
  List as ListIcon,
  Quote,
  Code,
  Heading1,
  Heading2,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Users,
  Activity
} from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { knowledgeBaseAPI } from '../api/knowledgeBase';
import Pagination from './Pagination';
import { StatCard } from './StatCard';

// Utility function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Utility function to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Utility function to estimate reading time
const estimateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = stripHtml(text).split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
};

const KnowledgeBase = ({ user, onNavigateToLogin }) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'manage'
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('published_at'); // 'published_at', 'title', 'view_count'

  // Management state
  const [showCreateArticle, setShowCreateArticle] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    totalCategories: 0,
    totalTags: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      loadArticles();
    } else {
      loadManagementData();
    }
  }, [currentPage, searchTerm, selectedCategory, selectedTags, sortBy, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, tagsRes, featuredRes] = await Promise.all([
        knowledgeBaseAPI.getCategories(),
        knowledgeBaseAPI.getTags(),
        knowledgeBaseAPI.getFeaturedArticles()
      ]);

      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setFeaturedArticles(featuredRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    try {
      const params = {
        page: currentPage,
        search: searchTerm,
        category: selectedCategory,
        tags: selectedTags.join(','),
        ordering: sortBy === 'published_at' ? '-published_at' : sortBy === 'title' ? 'title' : '-view_count'
      };

      const response = await knowledgeBaseAPI.getPublishedArticles(params);
      const articlesData = response.data.results || response.data;

      setArticles(articlesData);
      setTotalItems(response.data.count || articlesData.length);
      setTotalPages(Math.ceil((response.data.count || articlesData.length) / 12));
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    }
  };

  const loadManagementData = async () => {
    try {
      const [articlesRes, categoriesRes, tagsRes] = await Promise.all([
        user ? knowledgeBaseAPI.getMyArticles() : Promise.resolve({ data: [] }),
        knowledgeBaseAPI.getCategories(),
        knowledgeBaseAPI.getTags()
      ]);

      const allArticles = articlesRes.data.results || articlesRes.data || [];
      setArticles(allArticles);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);

      // Calculate stats
      const stats = {
        totalArticles: allArticles.length,
        publishedArticles: allArticles.filter(a => a.status === 'published').length,
        draftArticles: allArticles.filter(a => a.status === 'draft').length,
        totalViews: allArticles.reduce((sum, a) => sum + (a.view_count || 0), 0),
        totalCategories: categoriesRes.data.length,
        totalTags: tagsRes.data.length
      };
      setStats(stats);

      setTotalItems(allArticles.length);
      setTotalPages(Math.ceil(allArticles.length / 12));
    } catch (error) {
      console.error('Error loading management data:', error);
    }
  };

  const handleArticleClick = async (article) => {
    setSelectedArticle(article);
    // Increment view count
    try {
      await knowledgeBaseAPI.incrementArticleView(article.id);
      // Update local state
      setArticles(prev => prev.map(a =>
        a.id === article.id ? { ...a, view_count: a.view_count + 1 } : a
      ));
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleTagToggle = (tagName) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  // Management functions
  const handleCreateArticle = async (articleData) => {
    try {
      await knowledgeBaseAPI.createArticle({
        ...articleData,
        author_id: user?.id,
        author_first_name: user?.first_name,
        author_last_name: user?.last_name,
        author_email: user?.email
      });
      setShowCreateArticle(false);
      loadManagementData();
    } catch (error) {
      console.error('Error creating article:', error);
    }
  };

  const handleUpdateArticle = async (articleId, articleData) => {
    try {
      await knowledgeBaseAPI.updateArticle(articleId, articleData);
      setEditingArticle(null);
      loadManagementData();
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await knowledgeBaseAPI.deleteArticle(articleId);
        loadManagementData();
      } catch (error) {
        console.error('Error deleting article:', error);
      }
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      await knowledgeBaseAPI.createCategory(categoryData);
      setShowCreateCategory(false);
      loadManagementData();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCreateTag = async (tagData) => {
    try {
      await knowledgeBaseAPI.createTag(tagData);
      setShowCreateTag(false);
      loadManagementData();
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Knowledge Base</h1>
                <p className="text-xs text-slate-500">Articles, guides & documentation</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'browse' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Browse
                </button>
                {user && (
                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === 'manage' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Manage
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* View Mode Toggle */}
              {activeTab === 'browse' && (
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Management Actions - Show for any authenticated user */}
              {user && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('manage');
                      setShowCreateArticle(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Article</span>
                    <span className="sm:hidden">New</span>
                  </button>
                  {activeTab === 'manage' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowCreateCategory(true)}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                        title="Add Category"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowCreateTag(true)}
                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                        title="Add Tag"
                      >
                        <Hash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {activeTab === 'browse' ? (
          // Browse Tab Content
          <>
            {/* Welcome message for authenticated users */}
            {user && activeTab === 'browse' && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-900">Welcome back, {user.first_name}!</h3>
                    <p className="text-sm text-emerald-700">You can create and manage articles in the Knowledge Base.</p>
                  </div>
                </div>
              </div>
            )}
    
            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Featured Articles</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredArticles.map(article => (
                    <div
                      key={article.id}
                      onClick={() => handleArticleClick(article)}
                      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                          <BookMarked className="w-6 h-6 text-emerald-600" />
                        </div>
                        <Star className="w-5 h-5 text-amber-500 fill-current" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {article.excerpt || stripHtml(article.content).substring(0, 100) + '...'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{article.author_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{article.view_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 lg:p-6 mb-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Category Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="published_at">Newest First</option>
                    <option value="title">Title A-Z</option>
                    <option value="view_count">Most Viewed</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory || selectedTags.length > 0) && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 10).map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          selectedTags.includes(tag.name)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Articles Grid/List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Articles {totalItems > 0 && `(${totalItems})`}
                </h2>
              </div>

              {articles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles found</h3>
                  <p className="text-slate-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
                    : "space-y-4"
                }>
                  {articles.map(article => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      viewMode={viewMode}
                      onClick={() => handleArticleClick(article)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Manage Tab Content
          <div className="space-y-6">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Articles"
                value={stats.totalArticles}
                icon={<FileText className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                title="Published"
                value={stats.publishedArticles}
                icon={<CheckCircle className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                title="Drafts"
                value={stats.draftArticles}
                icon={<Edit className="w-5 h-5" />}
                color="orange"
              />
              <StatCard
                title="Total Views"
                value={stats.totalViews}
                icon={<Eye className="w-5 h-5" />}
                color="blue"
              />
            </div>

            {/* Management Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Articles Management */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900">Articles</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your knowledge base articles</p>
                  </div>
                  <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                    {articles.length === 0 ? (
                      <div className="p-8 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500">No articles yet</p>
                        <button
                          onClick={() => setShowCreateArticle(true)}
                          className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Create your first article
                        </button>
                      </div>
                    ) : (
                      articles.map(article => (
                        <div key={article.id} className="p-4 hover:bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate">{article.title}</h4>
                              <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                <span className={`px-2 py-1 rounded-full ${
                                  article.status === 'published' ? 'bg-green-100 text-green-700' :
                                  article.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {article.status}
                                </span>
                                <span>{article.view_count} views</span>
                                <span>{formatDate(article.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingArticle(article)}
                                className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(article.id)}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Categories & Tags Management */}
              <div className="space-y-6">
                {/* Categories */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">Categories</h4>
                      <button
                        onClick={() => setShowCreateCategory(true)}
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category.id} className="p-3 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">{category.name}</span>
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                        {category.description && (
                          <p className="text-xs text-slate-500 mt-1">{category.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">Tags</h4>
                      <button
                        onClick={() => setShowCreateTag(true)}
                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="p-3 flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs"
                        >
                          <Hash className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={12}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* Create/Edit Modals */}
      {showCreateArticle && (
        <ArticleEditorModal
          onClose={() => setShowCreateArticle(false)}
          onSave={handleCreateArticle}
          categories={categories}
          tags={tags}
        />
      )}

      {editingArticle && (
        <ArticleEditorModal
          article={editingArticle}
          onClose={() => setEditingArticle(null)}
          onSave={(data) => handleUpdateArticle(editingArticle.id, data)}
          categories={categories}
          tags={tags}
        />
      )}

      {showCreateCategory && (
        <CategoryEditorModal
          onClose={() => setShowCreateCategory(false)}
          onSave={handleCreateCategory}
        />
      )}

      {editingCategory && (
        <CategoryEditorModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(data) => {
            // Handle category update
            setEditingCategory(null);
            loadManagementData();
          }}
        />
      )}

      {showCreateTag && (
        <TagEditorModal
          onClose={() => setShowCreateTag(false)}
          onSave={handleCreateTag}
        />
      )}
    </div>
  );
};

// Article Card Component
const ArticleCard = ({ article, viewMode, onClick }) => {
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6 hover:shadow-lg transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
              {article.excerpt || stripHtml(article.content).substring(0, 150) + '...'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{article.author_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(article.published_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{estimateReadingTime(article.content)} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{article.view_count} views</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
    >
      {article.featured_image && (
        <div className="aspect-video bg-slate-100 relative overflow-hidden">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between mb-2">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            {article.category_name || 'General'}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Eye className="w-3 h-3" />
            <span>{article.view_count}</span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {article.title}
        </h3>

        <p className="text-sm text-slate-600 line-clamp-3 mb-4">
          {article.excerpt || stripHtml(article.content).substring(0, 120) + '...'}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{article.author_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(article.published_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{estimateReadingTime(article.content)}m</span>
            </div>
          </div>
        </div>

        {article.tags_list && article.tags_list.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags_list.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Article Detail Modal Component
const ArticleDetailModal = ({ article, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {article.category_name || 'General'}
                </span>
                <span className="text-sm text-slate-500">
                  {formatDate(article.published_at)}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{article.author_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{estimateReadingTime(article.content)} min read</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{article.view_count} views</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors ml-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {article.featured_image && (
            <div className="mb-6">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full max-h-64 object-cover rounded-xl"
              />
            </div>
          )}

          {article.excerpt && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-800 font-medium">{article.excerpt}</p>
            </div>
          )}

          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags_list && article.tags_list.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags_list.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Article Editor Modal Component
const ArticleEditorModal = ({ article, onClose, onSave, categories, tags }) => {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    category: article?.category || '',
    tags: article?.tags_list || [],
    status: article?.status || 'draft',
    featured_image: article?.featured_image || '',
    published_at: article?.published_at ? article.published_at.split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags,
        published_at: formData.status === 'published' && !formData.published_at
          ? new Date().toISOString()
          : formData.published_at || null
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tagName) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {article ? 'Edit Article' : 'Create New Article'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {article ? 'Update your article content' : 'Write a new article for the knowledge base'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter article title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Featured Image URL</label>
                <input
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {formData.status === 'published' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Publish Date</label>
                  <input
                    type="date"
                    value={formData.published_at}
                    onChange={(e) => setFormData({...formData, published_at: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Brief summary of the article..."
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.name)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        formData.tags.includes(tag.name)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Content *</label>
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={(value) => setFormData({...formData, content: value})}
              modules={modules}
              placeholder="Write your article content here..."
              className="bg-white"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? 'Saving...' : (article ? 'Update Article' : 'Create Article')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Category Editor Modal Component
const CategoryEditorModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {category ? 'Edit Category' : 'Create Category'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {category ? 'Update category details' : 'Add a new category'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Category name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Category description..."
              rows="3"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Tag Editor Modal Component
const TagEditorModal = ({ onClose, onSave }) => {
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({ name: tagName.trim().toLowerCase() });
      setTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Tag</h2>
              <p className="text-sm text-slate-500 mt-1">Add a new tag for categorizing articles</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Tag Name *</label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter tag name..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">Tags are automatically converted to lowercase</p>
          </div>
        </form>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !tagName.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {loading ? 'Creating...' : 'Create Tag'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;