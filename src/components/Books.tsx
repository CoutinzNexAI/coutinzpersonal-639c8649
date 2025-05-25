
import React, { useState } from 'react';
import { Book, BookOpen, Quote, Brain, Star, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface BookData {
  id: number;
  title: string;
  author: string;
  cover: string;
  rating: number;
  dateRead: string;
  category: string;
  status: 'read' | 'reading' | 'to-read';
  summary: string;
  keyLearnings: string[];
  favoriteQuotes: string[];
  personalThoughts: string;
  amazonLink?: string;
}

const booksData: BookData[] = [
  {
    id: 1,
    title: "Atomic Habits",
    author: "James Clear",
    cover: "/placeholder.svg",
    rating: 5,
    dateRead: "2024-01-15",
    category: "Self-Improvement",
    status: "read",
    summary: "A comprehensive guide to building good habits and breaking bad ones through small, incremental changes.",
    keyLearnings: [
      "1% better every day leads to remarkable results",
      "Focus on systems, not goals",
      "Environment design is crucial for habit formation",
      "The four laws of behavior change"
    ],
    favoriteQuotes: [
      "You do not rise to the level of your goals. You fall to the level of your systems.",
      "Every action you take is a vote for the type of person you wish to become."
    ],
    personalThoughts: "This book completely changed my approach to personal development. The emphasis on small, consistent improvements resonates deeply with my programming mindset of iterative improvement."
  },
  {
    id: 2,
    title: "The Clean Coder",
    author: "Robert C. Martin",
    cover: "/placeholder.svg",
    rating: 4,
    dateRead: "2023-11-20",
    category: "Programming",
    status: "read",
    summary: "A guide to professional software development practices and the mindset of a craftsman programmer.",
    keyLearnings: [
      "Professional responsibility in software development",
      "The importance of saying 'no' when necessary",
      "Test-driven development as a discipline",
      "Continuous learning and practice"
    ],
    favoriteQuotes: [
      "The only way to make the deadline—the only way to go fast—is to keep the code as clean as possible at all times.",
      "Professionals are not required to say yes to everything that is asked of them."
    ],
    personalThoughts: "Uncle Bob's insights into professionalism in software development helped shape my approach to coding and client relationships."
  },
  {
    id: 3,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    cover: "/placeholder.svg",
    rating: 5,
    dateRead: "2023-09-10",
    category: "History",
    status: "read",
    summary: "A fascinating exploration of how Homo sapiens came to dominate the world through cognitive, agricultural, and scientific revolutions.",
    keyLearnings: [
      "The power of shared myths and beliefs",
      "How agriculture changed human civilization",
      "The role of money, empires, and religion",
      "The potential future of humanity"
    ],
    favoriteQuotes: [
      "Culture tends to argue that it forbids only that which is unnatural. But from a biological perspective, nothing is unnatural.",
      "How do you cause people to believe in an imagined order such as Christianity, democracy, or capitalism? First, you never admit that the order is imagined."
    ],
    personalThoughts: "Mind-blowing perspective on human history that made me reconsider many assumptions about progress and civilization."
  }
];

const Books = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);

  const categories = ['all', 'Programming', 'Self-Improvement', 'History', 'Business', 'Science'];
  
  const filteredBooks = selectedCategory === 'all' 
    ? booksData 
    : booksData.filter(book => book.category === selectedCategory);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-cosmic-orange fill-current' : 'text-gray-600'}`} 
      />
    ));
  };

  return (
    <section id="books" className="section-padding bg-gradient-to-b from-cosmic-black to-cosmic-darkblue relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="section-title flex items-center justify-center gap-4">
            <BookOpen className="w-16 h-16 text-cosmic-blue animate-float" />
            Library
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            My intellectual journey through books that shaped my thinking, expanded my knowledge, 
            and inspired my growth as a developer and human being.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                selectedCategory === category
                  ? 'bg-cosmic-purple text-white shadow-lg shadow-cosmic-purple/50'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book, index) => (
            <Dialog key={book.id}>
              <DialogTrigger asChild>
                <Card 
                  className="group cursor-pointer bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden hover:border-cosmic-purple/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cosmic-purple/20 hover:-translate-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    {/* Book Cover & Status */}
                    <div className="relative mb-4">
                      <div className="aspect-[3/4] bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                        <Book className="w-16 h-16 text-cosmic-blue opacity-60" />
                      </div>
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        book.status === 'read' ? 'bg-green-500/20 text-green-400' :
                        book.status === 'reading' ? 'bg-cosmic-orange/20 text-cosmic-orange' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {book.status === 'read' ? 'Completed' : 
                         book.status === 'reading' ? 'Reading' : 'To Read'}
                      </div>
                    </div>

                    {/* Book Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cosmic-blue transition-colors duration-300 line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-cosmic-blue font-medium">{book.author}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStars(book.rating)}
                        <span className="text-sm text-gray-400 ml-2">{book.rating}/5</span>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(book.dateRead).toLocaleDateString()}
                        </span>
                        <span className="bg-cosmic-purple/20 text-cosmic-purple px-2 py-1 rounded-full text-xs">
                          {book.category}
                        </span>
                      </div>

                      <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                        {book.summary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              {/* Book Detail Modal */}
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-cosmic-black to-cosmic-darkblue border-cosmic-purple/30">
                <DialogHeader>
                  <DialogTitle className="text-2xl cosmic-gradient-text flex items-center gap-3">
                    <BookOpen className="w-8 h-8" />
                    {book.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Book Header */}
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-48 aspect-[3/4] bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 rounded-lg flex items-center justify-center">
                        <Book className="w-24 h-24 text-cosmic-blue opacity-60" />
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{book.title}</h3>
                        <p className="text-cosmic-blue text-lg">{book.author}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {renderStars(book.rating)}
                          <span className="text-sm text-gray-400 ml-2">{book.rating}/5</span>
                        </div>
                        <span className="bg-cosmic-purple/20 text-cosmic-purple px-3 py-1 rounded-full text-sm">
                          {book.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed">{book.summary}</p>
                    </div>
                  </div>

                  {/* Key Learnings */}
                  <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Brain className="w-6 h-6 text-cosmic-orange" />
                      Key Learnings
                    </h4>
                    <ul className="space-y-3">
                      {book.keyLearnings.map((learning, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-300">
                          <div className="w-2 h-2 bg-cosmic-orange rounded-full mt-2 flex-shrink-0" />
                          <span>{learning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Favorite Quotes */}
                  <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Quote className="w-6 h-6 text-cosmic-pink" />
                      Favorite Quotes
                    </h4>
                    <div className="space-y-4">
                      {book.favoriteQuotes.map((quote, idx) => (
                        <blockquote key={idx} className="border-l-4 border-cosmic-pink pl-4 italic text-gray-300 text-lg">
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  </div>

                  {/* Personal Thoughts */}
                  <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="text-xl font-bold text-white mb-4">My Thoughts</h4>
                    <p className="text-gray-300 leading-relaxed text-lg">{book.personalThoughts}</p>
                  </div>

                  {/* Action Button */}
                  {book.amazonLink && (
                    <div className="text-center">
                      <a 
                        href={book.amazonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cosmic-purple hover:bg-cosmic-purple/80 text-white rounded-lg transition-colors duration-300"
                      >
                        <ExternalLink className="w-5 h-5" />
                        View on Amazon
                      </a>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Reading Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold cosmic-gradient-text mb-2">
              {booksData.filter(book => book.status === 'read').length}
            </div>
            <div className="text-gray-300">Books Read</div>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold cosmic-gradient-text mb-2">
              {booksData.filter(book => book.status === 'reading').length}
            </div>
            <div className="text-gray-300">Currently Reading</div>
          </div>
          <div className="glass-panel p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold cosmic-gradient-text mb-2">
              {(booksData.reduce((sum, book) => sum + book.rating, 0) / booksData.length).toFixed(1)}
            </div>
            <div className="text-gray-300">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Books;
