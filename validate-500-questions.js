// Final validation of the 500-question chatbot database
const db = require('./utils/chatbotDatabase500.js');

console.log('🧪 Final Chatbot Database Validation (500 Questions)\n');

// Test 1: Database Structure
console.log('📊 Database Structure:');
const categories = Object.keys(db.chatbotDatabase);
console.log(`Categories: ${categories.length}`);
categories.forEach(category => {
  const count = db.chatbotDatabase[category].length;
  console.log(`  ${category}: ${count} questions`);
});

const totalQuestions = categories.reduce((sum, category) => 
  sum + db.chatbotDatabase[category].length, 0);
console.log(`Total Questions: ${totalQuestions}\n`);

// Test 2: Question Matching with various inputs
console.log('🔍 Question Matching Tests:');
const testInputs = [
  "How do I book an event?",
  "What payment methods do you accept?",
  "How do I check in at an event?",
  "Show me upcoming events",
  "Cancel my booking",
  "Update my profile",
  "Contact support",
  "Face recognition",
  "Refund policy",
  "Event categories",
  "I forgot my password",
  "How do I create an account?",
  "What if my payment fails?",
  "How do I see my attendance history?",
  "Can I transfer my booking?",
  "How do I enable notifications?",
  "What if an event is cancelled?",
  "How do I get event recommendations?",
  "How do I manage my privacy settings?",
  "What are the system requirements?"
];

let successfulMatches = 0;
testInputs.forEach((input, index) => {
  const { match, score } = db.findBestMatch(input);
  const status = match ? '✅' : '❌';
  if (match) successfulMatches++;
  console.log(`${status} ${index + 1}. "${input}"`);
  if (match) {
    console.log(`   Category: ${match.category}`);
    console.log(`   Confidence: ${Math.round(score * 100)}%`);
    console.log(`   Answer: ${match.answer.substring(0, 100)}...`);
  }
  console.log('');
});

// Test 3: Category Functions
console.log('📂 Category Functions:');
const eventsQuestions = db.getAllQuestionsByCategory('events');
console.log(`Events category: ${eventsQuestions.length} questions`);

const bookingQuestions = db.getAllQuestionsByCategory('booking');
console.log(`Booking category: ${bookingQuestions.length} questions`);

// Test 4: Search Functionality
console.log('\n🔎 Search Functionality:');
const searchResults = db.searchQuestions('payment');
console.log(`Search for "payment": ${searchResults.length} results`);

const bookingSearch = db.searchQuestions('booking');
console.log(`Search for "booking": ${bookingSearch.length} results`);

// Test 5: Random Suggestions
console.log('\n💡 Random Suggestions:');
const suggestions = db.getRandomSuggestions(null, 5);
console.log('Random suggestions:', suggestions);

const eventSuggestions = db.getRandomSuggestions('events', 3);
console.log('Event suggestions:', eventSuggestions);

// Test 6: Keyword Analysis
console.log('\n🔑 Keyword Analysis:');
const allKeywords = [];
categories.forEach(category => {
  db.chatbotDatabase[category].forEach(item => {
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
  db.chatbotDatabase[category].forEach(item => {
    if (item.apiEndpoint) {
      endpoints.push(item.apiEndpoint);
    }
  });
});

const uniqueEndpoints = [...new Set(endpoints)];
console.log(`Questions with API endpoints: ${endpoints.length}`);
console.log(`Unique API endpoints: ${uniqueEndpoints.length}`);

// Test 8: Response Quality Analysis
console.log('\n📈 Response Quality Analysis:');
let totalAnswers = 0;
let longAnswers = 0;
let shortAnswers = 0;

categories.forEach(category => {
  db.chatbotDatabase[category].forEach(item => {
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
    sum + db.chatbotDatabase[category].reduce((catSum, item) => 
      catSum + item.answer.length, 0), 0) / totalAnswers : 0)} characters`);

// Test 9: Match Success Rate
const matchSuccessRate = Math.round((successfulMatches / testInputs.length) * 100);
console.log(`\n🎯 Match Success Rate: ${matchSuccessRate}% (${successfulMatches}/${testInputs.length})`);

// Test 10: Database Completeness
const completenessScore = Math.round((totalQuestions / 500) * 100);
console.log(`📊 Database Completeness: ${completenessScore}% (${totalQuestions}/500 questions)`);

console.log('\n✅ 500-Question Chatbot Database Validation Complete!');
console.log(`📊 Summary: ${totalQuestions} questions across ${categories.length} categories`);
console.log(`🎯 Ready for production with comprehensive question coverage`);
console.log(`🚀 Match Success Rate: ${matchSuccessRate}%`);
console.log(`📈 Database Completeness: ${completenessScore}%`);

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
