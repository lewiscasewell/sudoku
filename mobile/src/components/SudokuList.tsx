import {Database, Q} from '@nozbe/watermelondb';
import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import {useNavigation} from '@react-navigation/native';
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, Dimensions} from 'react-native';
import Animated from 'react-native-reanimated';
import {Sudoku} from '../watermelondb';

type Props = {
  database: Database;
  search: string;
  isComplete: boolean;
  sudokus: Sudoku[];
};

const {width} = Dimensions.get('screen');

const SudokuList = ({sudokus, isComplete}: Props) => {
  const navigation = useNavigation();

  return (
    <Animated.FlatList
      data={sudokus.filter(i => i.isComplete === isComplete)}
      style={styles.list}
      numColumns={3}
      renderItem={({item}) => (
        <Animated.View style={{padding: 4, width: width * 0.33}}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              navigation.navigate('SudokuDetail', {
                sudokuId: item.id,
              });
            }}
            style={{
              display: 'flex',
              backgroundColor: '#1d1d1d',
              borderRadius: 8,
              height: 110,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: 'white',
                fontSize: 20,
                fontWeight: 900,
              }}>
              #{item.sudokuNumber}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 300,
    flex: 1,
  },
  count: {
    paddingVertical: 10,
    color: '#888',
    textAlign: 'center',
  },
});

const withModels = withObservables(['search'], ({database, search}: Props) => {
  const query = Q.sanitizeLikeString(search);

  return {
    sudokus: database
      .get<Sudoku>('sudokus')
      .query(Q.where('sudokuNumber', Q.like(`%${query}%`)))
      .observe(),
  };
});

export default withDatabase(withModels(SudokuList));
