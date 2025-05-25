
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Star, BookOpen, Calendar, User, ExternalLink } from 'lucide-react';

type Book = {
  id: number;
  title: string;
  author: string;
  year: number;
  rating: number;
  genre: string;
  cover: string;
  review: string;
  favoriteQuote?: string;
  readDate: string;
  status: 'completed' | 'reading' | 'wishlist';
};

const books: Book[] = [
  {
    id: 1,
    title: "The Martian",
    author: "Andy Weir",
    year: 2011,
    rating: 5,
    genre: "Sci-Fi",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop",
    review: "An incredible journey of survival and human ingenuity on Mars.",
    favoriteQuote: "I'm going to have to science the shit out of this.",
    readDate: "2024-01",
    status: 'completed'
  },
  {
    id: 2,
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    rating: 4,
    genre: "Self-Help",
    cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop",
    review: "Life-changing insights on building good habits and breaking bad ones.",
    favoriteQuote: "You do not rise to the level of your goals. You fall to the level of your systems.",
    readDate: "2024-02",
    status: 'completed'
  },
  {
    id: 3,
    title: "Neuromancer",
    author: "William Gibson",
    year: 1984,
    rating: 5,
    genre: "Cyberpunk",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop",
    review: "The cyberpunk masterpiece that defined a genre.",
    favoriteQuote: "The future is already here — it's just not very evenly distributed.",
    readDate: "2024-03",
    status: 'completed'
  },
  {
    id: 4,
    title: "Clean Code",
    author: "Robert C. Martin",
    year: 2008,
    rating: 4,
    genre: "Programming",
    cover: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&h=400&fit=crop",
    review: "Essential reading for any serious developer.",
    readDate: "2024-04",
    status: 'reading'
  }
];

const genreColors = {
  'Sci-Fi': 'from-cyan-400 to-blue-500',
  'Self-Help': 'from-green-400 to-emerald-500',
  'Cyberpunk': 'from-purple-400 to-pink-500',
  'Programming': 'from-orange-400 to-red-500',
  'Fiction': 'from-yellow-400 to-orange-500',
  'Biography': 'from-indigo-400 to-purple-500'
};

const Books = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'reading' | 'wishlist'>('all');

  const filteredBooks = books.filter(book => 
    filter === 'all' || book.status === filter
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
      />
    ));
  };

  return (
    <section id="books" className="section-padding relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-10 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-3xl animate-bounce-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-5xl md:text-6xl font-bold cosmic-gradient-text">
              Book Library
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Explore my digital bookshelf - a curated collection of knowledge, inspiration, and adventures through the written word
          </p>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {(['all', 'completed', 'reading', 'wishlist'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  filter === filterType
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredBooks.map((book, index) => (
            <div
              key={book.id}
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Book Card */}
              <div className="relative h-96 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 group-hover:shadow-2xl group-hover:shadow-cyan-500/20">
                {/* Holographic Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Book Cover */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  
                  {/* Status Badge */}
                  <Badge 
                    className={`absolute top-3 right-3 ${
                      book.status === 'completed' ? 'bg-green-500/80' :
                      book.status === 'reading' ? 'bg-blue-500/80' : 'bg-purple-500/80'
                    } text-white border-0`}
                  >
                    {book.status}
                  </Badge>
                </div>

                {/* Book Info */}
                <div className="p-6 space-y-3">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${genreColors[book.genre] || 'from-gray-400 to-gray-500'} text-white`}>
                    {book.genre}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">
                    {book.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{book.author}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{book.year}</span>
                  </div>
                  
                  {book.rating && (
                    <div className="flex items-center gap-1">
                      {renderStars(book.rating)}
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <button
                    onClick={() => setSelectedBook(book)}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Book Detail Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBook(null)}>
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-white/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <img
                    src={selectedBook.cover}
                    alt={selectedBook.title}
                    className="w-48 h-64 object-cover rounded-xl mx-auto md:mx-0"
                  />
                  <div className="flex-1 space-y-4">
                    <h3 className="text-3xl font-bold cosmic-gradient-text">{selectedBook.title}</h3>
                    <p className="text-xl text-gray-300">by {selectedBook.author}</p>
                    <div className="flex items-center gap-4">
                      <Badge className={`bg-gradient-to-r ${genreColors[selectedBook.genre]} text-white border-0`}>
                        {selectedBook.genre}
                      </Badge>
                      <span className="text-gray-400">{selectedBook.year}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedBook.rating)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-300 mb-2">My Review</h4>
                    <p className="text-gray-300 leading-relaxed">{selectedBook.review}</p>
                  </div>
                  
                  {selectedBook.favoriteQuote && (
                    <div>
                      <h4 className="text-lg font-semibold text-cyan-300 mb-2">Favorite Quote</h4>
                      <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-300">
                        "{selectedBook.favoriteQuote}"
                      </blockquote>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-gray-400">Read: {selectedBook.readDate}</span>
                    <button
                      onClick={() => setSelectedBook(null)}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Books;
