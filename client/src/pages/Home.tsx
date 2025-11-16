import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Myntra Clone
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your one-stop fashion destination with AI-powered virtual try-on
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Trending Now</h3>
            <p className="text-gray-600">Discover the latest fashion trends</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Virtual Try-On</h3>
            <p className="text-gray-600">See how clothes look on you with AI</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Great Deals</h3>
            <p className="text-gray-600">Amazing discounts on top brands</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;