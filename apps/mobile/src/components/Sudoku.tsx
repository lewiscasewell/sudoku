import {Database} from '@nozbe/watermelondb';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import {Route, useRoute} from '@react-navigation/native';
import produce from 'immer';
import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import * as R from 'remeda';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

// import {TouchableOpacity} from 'react-native-gesture-handler';
// import {switchMap} from 'rxjs';
const {width} = Dimensions.get('screen');

import {Sudoku} from '../watermelondb';

type Props = {
  route: Route<string, {sudokuId: string}>;
  database: Database;
  sudoku: Sudoku;
  //   comments: CommentModel[];
};

interface SudokuCell {
  rIndex: number;
  cIndex: number;
  current: string;
  answer: string;
  original: string;
}

type State = {
  cells: Record<string, SudokuCell>;
};

type Actions = {
  initialiseBoard: ({
    sudokuPuzzle,
    sudokuSolution,
  }: {
    sudokuPuzzle: string;
    sudokuSolution: string;
  }) => void;
  resetBoard: () => void;
  setCell: ({
    rIndex,
    cIndex,
    newValue,
  }: {
    rIndex: number;
    cIndex: number;
    newValue: string;
  }) => void;
};

export const useSudokuStore = create(
  immer<State & Actions>(set => ({
    initialiseBoard: ({sudokuPuzzle, sudokuSolution}) => {
      if (!sudokuPuzzle || !sudokuSolution) {
        return;
      }
      const splitSudoku = sudokuPuzzle.split('');
      const chunkedSudoku = R.chunk(splitSudoku, 9);
      const chunkedSolution = R.chunk(sudokuSolution.split(''), 9);
      chunkedSudoku.forEach((i, index) => {
        i.forEach((j, idx) =>
          set(
            produce(state => {
              state.cells[`${index}-${idx}`] = {
                rIndex: index,
                cIndex: idx,
                current: j,
                original: j,
                answer: chunkedSolution[index][idx],
              };
            }),
          ),
        );
      });
    },
    resetBoard: () => {},
    setCell: ({rIndex, cIndex, newValue}) =>
      set(state => {
        state.cells[`${rIndex}-${cIndex}`].current = newValue;
      }),
    cells: {
      '0-0': {
        rIndex: 0,
        cIndex: 0,
        current: '',
        answer: '',
      },
    },
  })),
);

const SudokuItem = ({sudoku}: Props) => {
  //   const navigation = useNavigation();
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const boardArray = R.chunk(sudoku.puzzle.split(''), 9);
  const [activeCell, setActiveCell] = useState({rIndex: null, cellIndex: null});
  console.log('active cell', activeCell);
  const some = useSudokuStore();

  useEffect(() => {
    some.initialiseBoard({
      sudokuPuzzle: sudoku.puzzle,
      sudokuSolution: sudoku.solution,
    });
  }, [sudoku]);

  console.log(some.cells);

  return (
    <View style={styles.screen}>
      <Animated.View style={styles.container}>
        <Text style={styles.title}>Difficulty: {sudoku.difficulty}</Text>
        <View>
          <View
            style={{
              justifyContent: 'space-evenly',
              borderColor: '#4d4d4d',
              borderWidth: 2,
            }}>
            {boardArray.map((row, rIndex) => {
              return (
                <View
                  key={rIndex}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    borderColor: '#4d4d4d',
                    borderTopWidth: rIndex % 3 === 0 && rIndex !== 0 ? 2 : 0.5,
                  }}>
                  {row?.map((cell, cellIndex) => {
                    return (
                      <TouchableOpacity
                        key={cellIndex}
                        activeOpacity={0.9}
                        onPressIn={() => setActiveCell({rIndex, cellIndex})}
                        style={{
                          backgroundColor:
                            cellIndex === activeCell.cellIndex &&
                            rIndex === activeCell.rIndex
                              ? '#0c4a6e'
                              : cellIndex === activeCell.cellIndex
                              ? '#0d0d0d'
                              : rIndex === activeCell.rIndex
                              ? '#0d0d0d'
                              : '#1d1d1d',
                          width: (Dimensions.get('screen').width * 0.95) / 9,
                          height: (Dimensions.get('screen').width * 0.95) / 9,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderColor: '#4d4d4d',
                          //   borderWidth: 0.5,
                          borderLeftWidth:
                            cellIndex % 3 === 0 && cellIndex !== 0 ? 2 : 0.5,
                        }}>
                        <Text
                          style={{
                            color:
                              some.cells?.[`${rIndex}-${cellIndex}`]
                                ?.current !==
                              some.cells?.[`${rIndex}-${cellIndex}`]?.answer
                                ? '#dc2626'
                                : some.cells?.[`${rIndex}-${cellIndex}`]
                                    ?.original === '.'
                                ? '#7dd3fc'
                                : 'white',
                            fontWeight: 600,
                            fontSize: 32,
                          }}>
                          {some.cells?.[`${rIndex}-${cellIndex}`]?.current ===
                          '.'
                            ? ''
                            : some.cells?.[`${rIndex}-${cellIndex}`]?.current}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
        <View
          style={{
            width,
            paddingHorizontal: 10,
            paddingVertical: 20,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
          }}>
          <TouchableOpacity
            style={{padding: 16, backgroundColor: '#2d2d2d', borderRadius: 8}}>
            <Text style={{color: 'white'}}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{padding: 16, backgroundColor: '#2d2d2d', borderRadius: 8}}>
            <Text style={{color: 'white'}}>Erase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{padding: 16, backgroundColor: '#2d2d2d', borderRadius: 8}}>
            <Text style={{color: 'white'}}>Hint</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            height: 60,
            width: Dimensions.get('screen').width,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
          }}>
          {array.map(i => {
            return (
              <View key={String(i)}>
                <TouchableOpacity
                  onPress={() => {
                    if (
                      activeCell.cellIndex === null ||
                      activeCell.rIndex === null
                    ) {
                      return;
                    }
                    if (
                      some.cells[`${activeCell.rIndex}-${activeCell.cellIndex}`]
                        .original === '.'
                    ) {
                      some.setCell({
                        cIndex: activeCell.cellIndex,
                        newValue: String(i),
                        rIndex: activeCell.rIndex,
                      });
                    }
                  }}>
                  <Text style={{color: '#7dd3fc', fontSize: 50}}>{i}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </Animated.View>
      {/* <FlatList
        data={comments.slice().reverse()}
        contentContainerStyle={styles.list}
        ListHeaderComponent={Header}
        renderItem={({item: comment}) => (
          <Comment key={comment.id} comment={comment} />
        )}
      />

      <Button
        title="Add comment"
        style={styles.addComment}
        onPress={() => {
          navigation.navigate('NewComment', {postId: post.id});
        }}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'darkgrey',
    width: Dimensions.get('screen').width * 0.95,
    height: Dimensions.get('screen').width * 0.95,
    // flexDirection: 'row',
    // flexWrap: 'wrap',
  },
  title: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '500',
    color: 'white',
  },
  delete: {
    color: '#f84',
  },
  body: {
    marginTop: 15,
    lineHeight: 20,
  },
  commentsCount: {
    marginTop: 30,
  },
  list: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addComment: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
});

const withModels = withObservables(['route'], ({database, route}: Props) => {
  const {sudokuId} = route.params;

  const sudoku$ = database.get<Sudoku>('sudokus').findAndObserve(sudokuId);

  return {
    sudoku: sudoku$,
    // comments: sudoku$.pipe(switchMap(sudoku => sudoku.comments.observe())),
  };
});

export default withDatabase(withModels(SudokuItem));
