import {appSchema, tableSchema} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'sudokus',
      columns: [
        {name: 'sudokuNumber', type: 'number'},
        {name: 'puzzle', type: 'string'},
        {name: 'solution', type: 'string'},
        {name: 'clues', type: 'number'},
        {name: 'difficulty', type: 'number'},
        {name: 'isComplete', type: 'boolean'},
      ],
    }),
    tableSchema({
      name: 'sudokuAttempts',
      columns: [
        {name: 'sudoku_id', type: 'string', isIndexed: true},
        {name: 'user_id', type: 'string'},
        {name: 'progress', type: 'string'},
        {name: 'totalElapsedTime', type: 'number'},
        {name: 'startTime', type: 'number'},
        {name: 'endTime', type: 'number'},
        {name: 'isComplete', type: 'boolean'},
      ],
    }),
  ],
});
