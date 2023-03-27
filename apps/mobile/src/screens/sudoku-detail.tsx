import {Database} from '@nozbe/watermelondb';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import {Route, useNavigation} from '@react-navigation/native';
import produce from 'immer';
import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  AppState,
} from 'react-native';
import Animated from 'react-native-reanimated';
import * as R from 'remeda';
import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';

import Feather from 'react-native-vector-icons/Feather';
import superjson from 'superjson';

const {width} = Dimensions.get('screen');

import {Sudoku} from '../watermelondb';
import {intervalToDuration} from 'date-fns';
import {persist} from 'zustand/middleware';

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
  notes: Record<string, boolean>;
}

import {PersistStorage} from 'zustand/middleware';
import {MMKV} from 'react-native-mmkv';

export const zustandStorageMMKV = new MMKV({id: 'zustand-persist'});

export const zustandStorage: PersistStorage<Actions & State> = {
  setItem: (name, value) => {
    return zustandStorageMMKV.set(name, superjson.stringify(value));
  },
  getItem: name => {
    const value = zustandStorageMMKV.getString(name);
    return superjson.parse(value ?? '') ?? null;
  },
  removeItem: name => {
    return zustandStorageMMKV.delete(name);
  },
};

type State = {
  sudokus: Record<
    string,
    {
      userId: string;
      status: 'playing' | 'paused' | 'not_started' | 'game_over';
      cells: Record<string, SudokuCell>;
      startTime: Date;
      checkpointTime: Date;
      totalElapsedTime: number;
      endTime: Date | null;
      mistakesCount: number;
    }
  >;
};

type Actions = {
  initialiseBoard: ({
    sudokuId,
    sudokuPuzzle,
    sudokuSolution,
  }: {
    sudokuId: string;
    sudokuPuzzle: string;
    sudokuSolution: string;
  }) => void;
  resetBoard: ({sudokuId}: {sudokuId: string}) => void;
  setCell: ({
    sudokuId,
    rIndex,
    cIndex,
    newValue,
    newNote,
  }: {
    sudokuId: string;
    rIndex: number;
    cIndex: number;
    newValue: string;
    newNote?: string;
  }) => void;
  pauseSudoku: ({sudokuId}: {sudokuId: string}) => void;
  resumeSudoku: ({sudokuId}: {sudokuId: string}) => void;
};

export const useSudokuStore = create(
  persist(
    immer<State & Actions>(set => ({
      initialiseBoard: ({sudokuId, sudokuPuzzle, sudokuSolution}) => {
        if (!sudokuPuzzle || !sudokuSolution) {
          return;
        }

        set(
          produce(state => {
            state.sudokus[sudokuId] = {
              status: 'playing',
              cells: {},
              startTime: new Date(),
              checkpointTime: new Date(),
              totalElapsedTime: 0,
              endTime: null,
              mistakesCount: 0,
            };
          }),
        );
        const splitSudoku = sudokuPuzzle.split('');
        const chunkedSudoku = R.chunk(splitSudoku, 9);
        const chunkedSolution = R.chunk(sudokuSolution.split(''), 9);
        chunkedSudoku.forEach((i, index) => {
          console.log('hi');
          i.forEach((j, idx) =>
            set(
              produce(state => {
                state.sudokus[sudokuId].cells[`${index}-${idx}`] = {
                  rIndex: index,
                  cIndex: idx,
                  current: j,
                  original: j,
                  notes: {
                    '1': false,
                    '2': false,
                    '3': false,
                    '4': false,
                    '5': false,
                    '6': false,
                    '7': false,
                    '8': false,
                    '9': false,
                  },
                  answer: chunkedSolution[index][idx],
                };
              }),
            ),
          );
        });
      },
      resetBoard: ({sudokuId}) => {
        set(state => {
          state.sudokus[sudokuId].status = 'not_started';
        });
      },
      pauseSudoku: ({sudokuId}) => {
        set(state => {
          if (state.sudokus[sudokuId] === undefined) {
            return;
          }
          if (state.sudokus[sudokuId]?.status === 'paused') {
            return;
          }

          if (!(state?.sudokus[sudokuId]?.checkpointTime instanceof Date)) {
            return;
          }

          const newTotalElapsedTime =
            new Date().getTime() -
            state.sudokus[sudokuId]?.checkpointTime.getTime() +
            state.sudokus[sudokuId].totalElapsedTime;

          state.sudokus[sudokuId].totalElapsedTime = newTotalElapsedTime;
          state.sudokus[sudokuId].checkpointTime = new Date();
          state.sudokus[sudokuId].status = 'paused';
        });
      },
      resumeSudoku: ({sudokuId}) => {
        set(state => {
          state.sudokus[sudokuId].status = 'playing';
          state.sudokus[sudokuId].checkpointTime = new Date();
        });
      },
      setCell: ({sudokuId, rIndex, cIndex, newValue, newNote}) =>
        set(state => {
          if (newNote) {
            state.sudokus[sudokuId].cells[`${rIndex}-${cIndex}`].notes[
              newNote
            ] =
              !state.sudokus[sudokuId].cells[`${rIndex}-${cIndex}`]?.notes[
                newNote
              ];
          }

          state.sudokus[sudokuId].cells[`${rIndex}-${cIndex}`].current =
            newValue;

          if (newValue === '.') {
            return;
          }

          if (
            state.sudokus[sudokuId].cells[`${rIndex}-${cIndex}`].answer !==
            newValue
          ) {
            state.sudokus[sudokuId].mistakesCount += 1;
            if (state.sudokus[sudokuId].mistakesCount >= 3) {
              state.sudokus[sudokuId].status = 'game_over';
            }
          }
        }),
      sudokus: {},
    })),
    {
      storage: zustandStorage,
      name: 'sudoku-store',
      //   onRehydrateStorage: state => console.log(state),
      //   serialize: state => JSON.stringify(state),
      //   deserialize: state => JSON.parse(state),
    },
  ),
);

const Timer: React.FC<{
  startTime: Date;
  totalElapsedTime: number;
  isPaused: boolean;
}> = ({startTime, totalElapsedTime, isPaused}) => {
  const [now, setNow] = React.useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setNow(new Date()), 200);
    return () => clearTimeout(timer);
  });
  if (!(startTime instanceof Date)) {
    return null;
  }

  const {hours, minutes, seconds} = intervalToDuration({
    start: isPaused
      ? new Date(now.getTime() - totalElapsedTime)
      : new Date(startTime.getTime() - totalElapsedTime),
    end: now,
  });
  const zeroPad = (num: number = 0, places: number) =>
    String(num).padStart(places, '0');

  return (
    <Text
      style={{
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        width: 90,
        textAlign: 'center',
      }}>
      {`${zeroPad(hours, 2)}:${zeroPad(minutes, 2)}:${zeroPad(seconds, 2)}`}
    </Text>
  );
};

const SudokuDetailScreen = ({sudoku}: Props) => {
  const navigation = useNavigation();
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const chunkedArray = R.chunk(array, 3);
  const boardArray = R.chunk(sudoku.puzzle.split(''), 9);
  const [notesMode, setNotesMode] = useState(false);
  const [activeCell, setActiveCell] = useState<{
    rIndex: number | null;
    cellIndex: number | null;
    number: string | null;
  }>({rIndex: null, cellIndex: null, number: null});

  const sudokuStore = useSudokuStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
      sudokuStore.pauseSudoku({sudokuId: sudoku.id});
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: `#${sudoku.sudokuNumber}`,
    });
  }, []);

  useEffect(() => {
    navigation.addListener('beforeRemove', e => {
      sudokuStore.pauseSudoku({sudokuId: sudoku.id});
    });
    navigation.addListener('blur', e => {
      console.log('WE JUST BLURRED');
    });
  }, []);
  const isCompleteArray =
    sudokuStore.sudokus[sudoku.id] &&
    Object.keys(sudokuStore.sudokus[sudoku.id]?.cells ?? {}).map(i => {
      const isComplete =
        sudokuStore.sudokus[sudoku.id].cells[i].answer ===
        sudokuStore.sudokus[sudoku.id].cells[i].current;

      return isComplete;
    });

  if (isCompleteArray?.every(i => i)) {
    console.log('YOU WIN - create SudokuAttempt - remove from zustand');
  }

  return (
    <View style={styles.screen}>
      <Animated.View style={styles.container}>
        <View
          style={{
            width: width * 0.98,
            alignItems: 'center',
            paddingVertical: 10,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text style={styles.title}>Difficulty: {sudoku.difficulty}</Text>
          <Text style={styles.title}>
            Mistakes {sudokuStore.sudokus[sudoku.id]?.mistakesCount}/3
          </Text>
          {sudokuStore.sudokus[sudoku.id] && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (sudokuStore.sudokus[sudoku.id]?.status === 'paused') {
                  sudokuStore.resumeSudoku({sudokuId: sudoku.id});
                }
                if (sudokuStore.sudokus[sudoku.id]?.status === 'playing') {
                  sudokuStore.pauseSudoku({sudokuId: sudoku.id});
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'row',

                alignItems: 'center',
                padding: 4,
              }}>
              <Timer
                startTime={sudokuStore?.sudokus[sudoku.id].checkpointTime}
                totalElapsedTime={
                  sudokuStore.sudokus[sudoku.id].totalElapsedTime
                }
                isPaused={
                  sudokuStore.sudokus[sudoku.id]?.status === 'paused' ||
                  sudokuStore.sudokus[sudoku.id]?.status === 'game_over'
                }
              />
              <View>
                {sudokuStore.sudokus[sudoku.id]?.status === 'paused' && (
                  <Feather name="play" color="white" size={16} />
                )}
                {sudokuStore.sudokus[sudoku.id]?.status === 'playing' && (
                  <Feather name="pause" color="white" size={16} />
                )}
              </View>
            </TouchableOpacity>
          )}
          {/* {sudokuStore.sudokus[sudoku.id]?.status === 'paused' || undefined ? (
            <View />
          ) : (
            <Button
              title="Pause"
              onPress={() => {
                sudokuStore.pauseSudoku({sudokuId: sudoku.id});
              }}
            />
          )} */}
        </View>
        <View>
          <View
            style={{
              justifyContent: 'space-evenly',
              borderColor: '#4d4d4d',
              borderWidth: 2,
            }}>
            {sudokuStore.sudokus[sudoku.id] === undefined && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'black',
                    zIndex: 1,
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <TouchableOpacity
                  onPress={() =>
                    sudokuStore.initialiseBoard({
                      sudokuId: sudoku.id,
                      sudokuPuzzle: sudoku.puzzle,
                      sudokuSolution: sudoku.solution,
                    })
                  }>
                  <Text
                    style={{
                      fontSize: 40,
                      fontWeight: 'bold',
                      zIndex: 10,
                      color: 'white',
                    }}>
                    Begin
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {sudokuStore.sudokus[sudoku.id]?.status === 'game_over' && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'black',
                    zIndex: 1,
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: 'bold',
                    zIndex: 10,
                    color: 'white',
                  }}>
                  Game Over
                </Text>
              </View>
            )}
            {sudokuStore.sudokus[sudoku.id]?.status === 'paused' && (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: 'black',
                    zIndex: 1,
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <Text
                  style={{
                    fontSize: 40,
                    fontWeight: 'bold',
                    zIndex: 10,
                    color: 'white',
                  }}>
                  Paused
                </Text>
              </View>
            )}
            {(sudokuStore.sudokus[sudoku.id]?.status === 'playing' ||
              sudokuStore.sudokus[sudoku.id]?.status === 'paused' ||
              sudokuStore.sudokus[sudoku.id]?.status === 'game_over' ||
              sudokuStore.sudokus[sudoku.id]?.status === undefined) &&
              boardArray.map((row, rIndex) => {
                return (
                  <View
                    key={rIndex}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-evenly',
                      borderColor: '#4d4d4d',
                      borderTopWidth:
                        rIndex % 3 === 0 && rIndex !== 0 ? 2 : 0.5,
                    }}>
                    {row?.map((cell, cellIndex) => {
                      return (
                        <TouchableOpacity
                          key={cellIndex}
                          activeOpacity={0.9}
                          onFocus={() => console.log('hi')}
                          onPressIn={() =>
                            setActiveCell({
                              rIndex,
                              cellIndex,
                              number:
                                sudokuStore.sudokus[sudoku.id].cells[
                                  `${rIndex}-${cellIndex}`
                                ].current,
                            })
                          }
                          style={{
                            backgroundColor:
                              (cellIndex === activeCell.cellIndex &&
                                rIndex === activeCell.rIndex) ||
                              (activeCell.number ===
                                sudokuStore.sudokus[sudoku.id]?.cells[
                                  `${rIndex}-${cellIndex}`
                                ].current &&
                                sudokuStore.sudokus[sudoku.id]?.cells[
                                  `${rIndex}-${cellIndex}`
                                ].current !== '.')
                                ? '#0c4a6e'
                                : cellIndex === activeCell.cellIndex
                                ? '#0d0d0d'
                                : rIndex === activeCell.rIndex
                                ? '#0d0d0d'
                                : '#1d1d1d',
                            width: (width * 0.98) / 9,
                            height: (width * 0.98) / 9,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderColor: '#4d4d4d',
                            //   borderWidth: 0.5,
                            borderLeftWidth:
                              cellIndex % 3 === 0 && cellIndex !== 0 ? 2 : 0.5,
                          }}>
                          {sudokuStore.sudokus[sudoku.id]?.cells?.[
                            `${rIndex}-${cellIndex}`
                          ]?.current === '.' && (
                            <View
                              style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                padding: 3,
                              }}>
                              {chunkedArray?.map((i, index) => {
                                return (
                                  <View
                                    key={index}
                                    style={{
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'stretch',
                                      height: '33%',
                                    }}>
                                    {i.map((j, jndex) => {
                                      return (
                                        <Text
                                          key={jndex}
                                          style={{
                                            color: 'white',
                                            fontSize: 10,
                                            opacity: sudokuStore.sudokus[
                                              sudoku.id
                                            ]?.cells?.[`${rIndex}-${cellIndex}`]
                                              ?.notes?.[j]
                                              ? 1
                                              : 0,
                                          }}>
                                          {j}
                                        </Text>
                                      );
                                    })}
                                  </View>
                                );
                              })}
                            </View>
                          )}
                          <Text
                            style={{
                              color:
                                sudokuStore.sudokus[sudoku.id]?.cells?.[
                                  `${rIndex}-${cellIndex}`
                                ]?.current !==
                                sudokuStore.sudokus[sudoku.id]?.cells?.[
                                  `${rIndex}-${cellIndex}`
                                ]?.answer
                                  ? '#dc2626'
                                  : sudokuStore.sudokus[sudoku.id]?.cells?.[
                                      `${rIndex}-${cellIndex}`
                                    ]?.original === '.'
                                  ? '#7dd3fc'
                                  : 'white',
                              fontWeight: 600,
                              fontSize: 32,
                            }}>
                            {sudokuStore.sudokus[sudoku.id]?.cells?.[
                              `${rIndex}-${cellIndex}`
                            ]?.current === '.'
                              ? ''
                              : sudokuStore.sudokus[sudoku.id]?.cells[
                                  `${rIndex}-${cellIndex}`
                                ]?.current}
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
            onPress={() =>
              sudokuStore.initialiseBoard({
                sudokuId: sudoku.id,
                sudokuPuzzle: sudoku.puzzle,
                sudokuSolution: sudoku.solution,
              })
            }
            style={{padding: 16, backgroundColor: '#2d2d2d', borderRadius: 8}}>
            <Text style={{color: 'white'}}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (activeCell.cellIndex && activeCell.rIndex) {
                sudokuStore.setCell({
                  sudokuId: sudoku.id,
                  rIndex: activeCell.rIndex,
                  cIndex: activeCell.cellIndex,
                  newValue: '.',
                  //   newNote: 'erase_notes',
                });
                setActiveCell(current => ({
                  rIndex: current.rIndex,
                  cellIndex: current.cellIndex,
                  number: '.',
                }));
              }
            }}
            style={{padding: 16, backgroundColor: '#2d2d2d', borderRadius: 8}}>
            <Text style={{color: 'white'}}>Erase</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={() => {
              setNotesMode(!notesMode);
            }}
            style={{
              padding: 16,
              backgroundColor: notesMode ? '#7dd3fc' : '#2d2d2d',
              borderRadius: 8,
            }}>
            <Text style={{color: 'white'}}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{padding: 16, backgroundColor: '#2d2d2d', borderRadius: 8}}>
            <Text style={{color: 'white'}}>Hint</Text>
          </TouchableOpacity>
        </View>
        {sudokuStore.sudokus[sudoku.id]?.status === 'playing' && (
          <View
            style={{
              height: 60,
              width: width,
              flexDirection: 'row',
              justifyContent: 'space-evenly',
            }}>
            {array.map(i => {
              return (
                <View key={String(i)}>
                  <TouchableOpacity
                    style={{
                      width: width / 9,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      if (
                        activeCell.cellIndex === null ||
                        activeCell.rIndex === null
                      ) {
                        return;
                      }

                      if (
                        sudokuStore.sudokus[sudoku.id]?.cells[
                          `${activeCell.rIndex}-${activeCell.cellIndex}`
                        ].original === '.' &&
                        notesMode
                      ) {
                        sudokuStore.setCell({
                          sudokuId: sudoku.id,
                          cIndex: activeCell.cellIndex,
                          newValue: '.',
                          rIndex: activeCell.rIndex,
                          newNote: String(i),
                        });

                        return;
                      }
                      if (
                        sudokuStore.sudokus[sudoku.id]?.cells[
                          `${activeCell.rIndex}-${activeCell.cellIndex}`
                        ].original === '.'
                      ) {
                        setActiveCell(current => ({
                          cellIndex: current.cellIndex,
                          rIndex: current.rIndex,
                          number: String(i),
                        }));
                        sudokuStore.setCell({
                          sudokuId: sudoku.id,
                          cIndex: activeCell.cellIndex,
                          newValue: String(i),
                          rIndex: activeCell.rIndex,
                        });
                      }
                    }}>
                    {Object.keys(sudokuStore.sudokus[sudoku.id]?.cells)
                      .map(s => {
                        return (
                          sudokuStore.sudokus[sudoku.id].cells[s]?.current ===
                          String(i)
                        );
                      })
                      ?.filter(a => a === true).length !== 9 && (
                      <Text style={{color: '#7dd3fc', fontSize: 50}}>{i}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
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
    width: width * 0.98,
    height: width * 0.98,
  },
  title: {
    flexShrink: 1,
    fontSize: 14,
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

export default withDatabase(withModels(SudokuDetailScreen));
