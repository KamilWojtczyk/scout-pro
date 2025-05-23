import uvicorn
import sys
from pathlib import Path

def main():
    """Run the ScoutPro API server"""
    
    print("🚀 Starting ScoutPro Enhanced API Server...")
    print("📋 New Features:")
    print("  ✅ Advanced filtering (position, age, competition, etc.)")
    print("  ✅ Player search with autocomplete")
    print("  ✅ Player similarity analysis using OBV values")
    print("  ✅ Database statistics and metadata endpoints")
    print("  ✅ Enhanced pagination with total counts")
    print("  ✅ Comprehensive error handling")
    print()
    print("📖 API Documentation: http://localhost:8000/docs")
    print("📊 Database Stats: http://localhost:8000/stats/overview")
    print("🔍 Test Search: http://localhost:8000/players/search?q=Barcelona")
    print()
    
    # Check if .env file exists
    if not Path(".env").exists():
        print("⚠️  Warning: .env file not found!")
        print("Create .env with your database credentials:")
        print("DB_HOST=your-aws-endpoint")
        print("DB_USER=your-username") 
        print("DB_PASS=your-password")
        print("DB_NAME=your-database")
        return
    
    try:
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()