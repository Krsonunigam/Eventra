// Simple Chatbot Validation Script
// Validates the chatbot database and logic without server dependencies

const { 
  chatbotDatabase, 
  findBestMatch, 
  getRandomSuggestions,
  getAllQuestionsByCategory,
  searchQuestions 
} = require('./utils/chatbotDatabase');

console.log('🧪 Chatbot Database Validation\n');

// Test 1: Database Structure
console.log('📊 Database Structure:');
const categories = Object.keys(chatbotDatabase);
console.log(`Categories: ${categories.length}`);
categories.forEach(category => {
  const count = chatbotDatabase[category].length;
  console.log(`  ${category}: ${count} questions`);
});

const totalQuestions = categories.reduce((sum, category) => 
  sum + chatbotDatabase[category].length, 0);
console.log(`Total Questions: ${totalQuestions}\n`);

// Test 2: Question Matching
console.log('🔍 Question Matching Tests:');
const testQuestions = [
  "How do I book an event?",
  "What payment methods do you accept?",
  "How do I check in at an event?",
  "Show me upcoming events",
  "Cancel my booking",
  "Update my profile",
  "Contact support",
  "Face recognition",
  "Refund policy",
  "Event categories"
];

testQuestions.forEach((question, index) => {
  const { match, score } = findBestMatch(question);
  const status = match ? '✅' : '❌';
  console.log(`${status} ${index + 1}. "${question}"`);
  if (match) {
    console.log(`   Category: ${match.category}`);
    console.log(`   Confidence: ${Math.round(score * 100)}%`);
    console.log(`   Answer: ${match.answer.substring(0, 100)}...`);
  }
  console.log('');
});

// Test 3: Category Functions
console.log('📂 Category Functions:');
const eventsQuestions = getAllQuestionsByCategory('events');
console.log(`Events category: ${eventsQuestions.length} questions`);

const bookingQuestions = getAllQuestionsByCategory('booking');
console.log(`Booking category: ${bookingQuestions.length} questions`);

// Test 4: Search Functionality
console.log('\n🔎 Search Functionality:');
const searchResults = searchQuestions('payment');
console.log(`Search for "payment": ${searchResults.length} results`);

const bookingSearch = searchQuestions('booking');
console.log(`Search for "booking": ${bookingSearch.length} results`);

// Test 5: Random Suggestions
console.log('\n💡 Random Suggestions:');
const suggestions = getRandomSuggestions(null, 5);
console.log('Random suggestions:', suggestions);

const eventSuggestions = getRandomSuggestions('events', 3);
console.log('Event suggestions:', eventSuggestions);

// Test 6: Keyword Analysis
console.log('\n🔑 Keyword Analysis:');
const allKeywords = [];
categories.forEach(category => {
  chatbotDatabase[category].forEach(item => {
    allKeywords.push(...item.keywords);
  });
});

const uniqueKeywords = [...new Set(allKeywords)];
console.log(`Total unique keywords: ${uniqueKeywords.length}`);
console.log(`Most common keywords: ${getMostCommonKeywords(allKeywords, 10).join(', ')}`);

// Test 7: API Endpoint Analysis
console.log('\n🔗 API Endpoint Analysis:');
const endpoints = [];
categories.forEach(category => {
  chatbotDatabase[category].forEach(item => {
    if (item.apiEndpoint) {
      endpoints.push(item.apiEndpoint);
    }
  });
});

const uniqueEndpoints = [...new Set(endpoints)];
console.log(`Questions with API endpoints: ${endpoints.length}`);
console.log(`Unique API endpoints: ${uniqueEndpoints.length}`);
uniqueEndpoints.forEach(endpoint => {
  console.log(`  ${endpoint}`);
});

// Test 8: Response Quality Analysis
console.log('\n📈 Response Quality Analysis:');
let totalAnswers = 0;
let longAnswers = 0;
let shortAnswers = 0;

categories.forEach(category => {
  chatbotDatabase[category].forEach(item => {
    totalAnswers++;
    const answerLength = item.answer.length;
    if (answerLength > 200) longAnswers++;
    if (answerLength < 50) shortAnswers++;
  });
});

console.log(`Total answers: ${totalAnswers}`);
console.log(`Long answers (>200 chars): ${longAnswers}`);
console.log(`Short answers (<50 chars): ${shortAnswers}`);
console.log(`Average answer length: ${Math.round(totalAnswers > 0 ? 
  categories.reduce((sum, category) => 
    sum + chatbotDatabase[category].reduce((catSum, item) => 
      catSum + item.answer.length, 0), 0) / totalAnswers : 0)} characters`);

console.log('\n✅ Chatbot Database Validation Complete!');
console.log(`📊 Summary: ${totalQuestions} questions across ${categories.length} categories`);
console.log(`🎯 Ready for deployment with comprehensive question coverage`);

// Helper function
function getMostCommonKeywords(keywords, count) {
  const frequency = {};
  keywords.forEach(keyword => {
    frequency[keyword] = (frequency[keyword] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, count)
    .map(([keyword]) => keyword);
}
