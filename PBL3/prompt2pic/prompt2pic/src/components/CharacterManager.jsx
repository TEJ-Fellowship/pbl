import React, { useState } from 'react';
import { Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Button from './ui/Button';

const CharacterManager = ({ characters, setCharacters }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const addCharacter = () => {
    if (characters.length < 5) {
      const newId = `c${characters.length + 1}`;
      setCharacters([...characters, { id: newId, description: '' }]);
    }
  };

  const removeCharacter = (id) => {
    if (characters.length > 1) {
      setCharacters(characters.filter(char => char.id !== id));
    }
  };

  const updateCharacter = (id, description) => {
    setCharacters(characters.map(char => 
      char.id === id ? { ...char, description } : char
    ));
  };

  return (
    <Card className="mb-8 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-gray-800">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mr-3">
              <Users className="w-5 h-5 text-white" />
            </div>
            Character Cast
            <span className="ml-2 px-2 py-1 bg-white rounded-lg text-xs font-medium text-gray-600">
              {characters.length}/5
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button
              onClick={addCharacter}
              disabled={characters.length >= 5}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Character
            </Button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {characters.map((character, index) => (
              <div key={character.id} className="group relative">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {character.id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <textarea
                      placeholder="Describe your character (e.g., elderly wizard with long white beard, wearing blue robes and pointed hat)"
                      value={character.description}
                      onChange={(e) => updateCharacter(character.id, e.target.value)}
                      className="w-full h-16 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm placeholder-gray-500"
                    />
                  </div>
                  
                  {characters.length > 1 && (
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => removeCharacter(character.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {characters.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No characters yet. Add your first character to get started!</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CharacterManager;