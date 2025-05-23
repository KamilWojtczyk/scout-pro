import requests
import json
from urllib.parse import quote

BASE_URL = "http://localhost:8000"

def test_basic_functionality():
    """Test basic API functionality"""
    print("🧪 Testing Basic API Functionality...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Start server with: uvicorn main:app --reload")
        return False
    
    return True

def test_enhanced_players_endpoint():
    """Test the enhanced players endpoint with pagination"""
    print("\n👥 Testing Enhanced Players Endpoint...")
    
    try:
        # Test basic pagination
        response = requests.get(f"{BASE_URL}/players?limit=5")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Enhanced players endpoint - Total: {data['total']}")
            print(f"📄 Has next: {data['has_next']}, Has previous: {data['has_previous']}")
            
            if data['players']:
                player = data['players'][0]
                print(f"📝 Sample player: {player['normalized_player_name']} - {player['team']}")
                return player  # Return for similarity testing
        else:
            print(f"❌ Enhanced players endpoint failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing enhanced players: {e}")
    
    return None

def test_filtering():
    """Test various filtering options"""
    print("\n🎯 Testing Filtering Options...")
    
    filters_to_test = [
        {"team": "Barcelona", "desc": "team filter"},
        {"position": "Midfielder", "desc": "position filter"},
        {"min_age": 25, "max_age": 30, "desc": "age range filter"},
        {"search": "Messi", "desc": "search functionality"}
    ]
    
    for filter_test in filters_to_test:
        try:
            desc = filter_test.pop("desc")
            response = requests.get(f"{BASE_URL}/players", params=filter_test)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {desc} - Found {data['total']} players")
            else:
                print(f"❌ {desc} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing {desc}: {e}")

def test_metadata_endpoints():
    """Test metadata endpoints"""
    print("\n🔍 Testing Metadata Endpoints...")
    
    endpoints = [
        ("/metadata/positions", "positions"),
        ("/metadata/teams", "teams"),
        ("/metadata/seasons", "seasons"),
        ("/metadata/competitions", "competitions")
    ]
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name} - Found {len(data)} items")
                if data and len(data) <= 10:
                    print(f"📋 Sample {name}: {data[:5]}")
            else:
                print(f"❌ {name} failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing {name}: {e}")

def test_search_functionality():
    """Test search/autocomplete functionality"""
    print("\n🔍 Testing Search Functionality...")
    
    search_terms = ["Barcelona", "Messi", "Real"]
    
    for term in search_terms:
        try:
            response = requests.get(f"{BASE_URL}/players/search?q={term}&limit=5")
            if response.status_code == 200:
                results = response.json()
                print(f"✅ Search '{term}' - Found {len(results)} results")
                if results:
                    print(f"📝 First result: {results[0]['normalized_player_name']}")
            else:
                print(f"❌ Search '{term}' failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing search '{term}': {e}")

def test_specific_player_and_similarity(sample_player=None):
    """Test getting specific player and similarity search"""
    print("\n👤 Testing Specific Player & Similarity...")
    
    if not sample_player:
        # Get a sample player first
        try:
            response = requests.get(f"{BASE_URL}/players?limit=1")
            if response.status_code == 200:
                data = response.json()
                if data['players']:
                    sample_player = data['players'][0]
        except Exception as e:
            print(f"❌ Could not get sample player: {e}")
            return
    
    if not sample_player:
        print("❌ No sample player available for testing")
        return
    
    name = sample_player['normalized_player_name']
    team = sample_player['team']
    season = sample_player['season']
    
    print(f"📝 Testing with: {name} - {team} - {season}")
    
    # URL encode the parameters
    encoded_name = quote(name)
    encoded_team = quote(team)
    encoded_season = quote(season)
    
    try:
        # Test getting specific player
        response = requests.get(f"{BASE_URL}/players/{encoded_name}/{encoded_team}/{encoded_season}")
        if response.status_code == 200:
            print("✅ Get specific player - Success")
            
            # Test similarity search
            response = requests.get(f"{BASE_URL}/players/{encoded_name}/{encoded_team}/{encoded_season}/similar?limit=3")
            if response.status_code == 200:
                similar = response.json()
                print(f"✅ Similarity search - Found {len(similar)} similar players")
                if similar:
                    top_match = similar[0]
                    print(f"🎯 Most similar: {top_match['player']['normalized_player_name']} ({top_match['similarity_percentage']:.1f}%)")
                    print(f"🔗 Key similarities: {', '.join(top_match['key_similarities'])}")
            else:
                print(f"❌ Similarity search failed: {response.status_code}")
                print(response.text)
        else:
            print(f"❌ Get specific player failed: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error testing specific player/similarity: {e}")

def test_database_stats():
    """Test database statistics endpoint"""
    print("\n📊 Testing Database Statistics...")
    
    try:
        response = requests.get(f"{BASE_URL}/stats/overview")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Database stats - Total players: {stats['total_players']}")
            print(f"📅 Seasons: {len(stats['seasons'])} different seasons")
            print(f"🏆 Competitions: {len(stats['competitions'])} competitions")
            print(f"⚽ Positions: {len(stats['positions'])} different positions")
        else:
            print(f"❌ Database stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing database stats: {e}")

def run_all_tests():
    """Run all tests in sequence"""
    print("🚀 Starting Enhanced ScoutPro API Tests...\n")
    
    # Test basic connectivity
    if not test_basic_functionality():
        return
    
    # Test enhanced players endpoint and get sample player
    sample_player = test_enhanced_players_endpoint()
    
    # Test filtering
    test_filtering()
    
    # Test metadata endpoints
    test_metadata_endpoints()
    
    # Test search
    test_search_functionality()
    
    # Test database stats
    test_database_stats()
    
    # Test specific player and similarity (most complex)
    test_specific_player_and_similarity(sample_player)
    
    print("\n🎉 All tests completed!")
    print("💡 Visit http://localhost:8000/docs for interactive API documentation")

if __name__ == "__main__":
    run_all_tests()