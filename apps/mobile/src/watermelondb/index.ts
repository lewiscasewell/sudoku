import {
  Collection,
  Database,
  Model,
  Query,
  Relation,
} from '@nozbe/watermelondb';
import {Associations} from '@nozbe/watermelondb/Model';
import {children, field, relation} from '@nozbe/watermelondb/decorators';
import {SyncDatabaseChangeSet, synchronize} from '@nozbe/watermelondb/sync';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {schema} from './schema';
import {
  addColumns,
  schemaMigrations,
} from '@nozbe/watermelondb/Schema/migrations';
import {sudukoData} from '../screens/home';
export enum TableName {
  SUDOKUS = 'sudokus',
  SUDOKU_ATTEMPTS = 'sudokuAttempts',
}

export class Sudoku extends Model {
  static table = TableName.SUDOKUS;
  static associations: Associations = {
    [TableName.SUDOKU_ATTEMPTS]: {type: 'has_many', foreignKey: 'sudoku_id'},
  };

  @field('puzzle')
  puzzle!: string;

  @field('solution')
  solution!: string;

  @field('clues')
  clues!: number;

  @field('difficulty')
  difficulty!: number;

  @field('isComplete')
  isComplete!: boolean;

  @field('sudokuNumber')
  sudokuNumber!: number;

  @children('sudokuAttempts')
  sudokuAttempts!: Query<SudokuAttempt>;
}

export class SudokuAttempt extends Model {
  static table: string = TableName.SUDOKU_ATTEMPTS;

  static associations: Associations = {
    [TableName.SUDOKUS]: {type: 'belongs_to', key: 'sudoku_id'},
  };

  @field('user_id') user_id!: string;

  @field('progress') progress!: string;

  @field('totalElapsedTime') totalElapsedTime!: number;

  @field('startTime') startTime!: number;

  @field('endTime') endTime!: number;

  @field('isComplete') isComplete!: boolean;

  @relation(TableName.SUDOKUS, 'sudoku_id') sudoku!: Relation<Sudoku>;
}

const adapter = new SQLiteAdapter({
  dbName: 'SudokuDB',
  schema: schema,
  migrations: schemaMigrations({
    migrations: [
      {
        toVersion: 2,
        steps: [
          addColumns({
            table: 'sudokus',
            columns: [{name: 'sudokuNumber', type: 'number'}],
          }),
        ],
      },
    ],
  }),
});

export const db = new Database({
  adapter,
  modelClasses: [Sudoku, SudokuAttempt],
});

export const sync = async () => {
  return synchronize({
    database: db,
    async pullChanges({lastPulledAt, schemaVersion, migration}) {
      console.log('pull changes?:', lastPulledAt, schemaVersion, migration);
      const serverTS = new Date().getTime();
      const serverChanges: SyncDatabaseChangeSet = {
        [TableName.SUDOKU_ATTEMPTS]: {
          created: [],
          updated: [],
          deleted: ['some-id'],
        },
      };

      return {changes: serverChanges, timestamp: serverTS};
    },
    async pushChanges({changes, lastPulledAt}) {
      console.log('CHANGES', changes);
      console.log('LAST PULLED AT', lastPulledAt);
      return undefined;
    },
  });
};

export const generateSudokus = (database: Database) =>
  database.write(async () => {
    await database.unsafeResetDatabase();
    await sudukoData.forEach(data => {
      (database.collections.get('sudokus') as Collection<Sudoku>).create(
        sudoku => {
          sudoku.sudokuNumber = data.id;
          sudoku.puzzle = data.puzzle;
          sudoku.solution = data.solution;
          sudoku.clues = data.clues;
          sudoku.difficulty = data.difficulty;
          if (data.id === 4) {
            sudoku.isComplete = true;
          } else {
            sudoku.isComplete = false;
          }
        },
      );
    });
  });
