import React, {useCallback, useState} from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  Dimensions,
  LayoutChangeEvent,
  TouchableOpacity,
} from 'react-native';

import SudokuList from '../components/SudokuList';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

export const sudukoData = [
  {
    id: 1,
    puzzle:
      '1..5.37..6.3..8.9......98...1.......8761..........6...........7.8.9.76.47...6.312',
    solution:
      '198543726643278591527619843914735268876192435235486179462351987381927654759864312',
    clues: 27,
    difficulty: 2.2,
  },
  {
    id: 2,
    puzzle:
      '...81.....2........1.9..7...7..25.934.2............5...975.....563.....4......68.',
    solution:
      '934817256728653419615942738176425893452398167389176542897564321563281974241739685',
    clues: 23,
    difficulty: 0.0,
  },
  {
    id: 30,
    puzzle:
      '..5...74.3..6...19.....1..5...7...2.9....58..7..84......3.9...2.9.4.....8.....1.3',
    solution:
      '215983746387654219469271385538716924941325867726849531653198472192437658874562193',
    clues: 25,
    difficulty: 2.6,
  },
  {
    id: 4,
    puzzle:
      '........5.2...9....9..2...373..481.....36....58....4...1...358...42.......978...2',
    solution:
      '473816925628539741195427863732948156941365278586172439217693584864251397359784612',
    clues: 26,
    difficulty: 1.4,
  },
  {
    id: 500,
    puzzle:
      '.4.1..............653.....1.8.9..74...24..91.......2.8...562....1..7..6...4..1..3',
    solution:
      '947153682128649357653287491381926745572438916496715238839562174215374869764891523',
    clues: 25,
    difficulty: 1.1,
  },
];

const {width} = Dimensions.get('screen');

const tabData = [
  {title: 'Sudokus', key: '0'},
  {title: 'Completed', key: '1'},
];

const Indicator = ({measures, scrollOffset}) => {
  const inputWidth = tabData.map((u, i) => i * width);
  const outputWidth = measures.map(measure => measure.w);
  console.log(outputWidth);
  const outputX = measures.map(measure => measure.x);

  const animatedStyles = useAnimatedStyle(() => {
    const indicatorWidth = interpolate(
      scrollOffset.value,
      inputWidth,
      outputWidth,
      {
        extrapolateLeft: Extrapolation.IDENTITY,
      },
    );
    const translateX = interpolate(scrollOffset.value, inputWidth, outputX, {
      extrapolateLeft: Extrapolation.IDENTITY,
    });
    return {
      transform: [{translateX}],
      width: indicatorWidth,
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          backgroundColor: 'white',
          height: 4,
          bottom: 0,
          left: 0,
          borderRadius: 4,
        },
        animatedStyles,
      ]}
    />
  );
};

const Tab = ({
  item,
  setMeasures,
  onItemPress,
  index,
  currentSelectedIndex,
  scrollOffset,
}) => {
  const onLayout = ({
    nativeEvent: {
      layout: {x, y, width: w, height: h},
    },
  }: LayoutChangeEvent) => {
    setMeasures(currentMeasures => {
      if (currentMeasures.some(i => Number(i.k) === index)) {
        return [...currentMeasures].sort((a, b) => a.k - b.k);
      }

      return [...currentMeasures, {x, y, w, h, k: item.key}].sort(
        (a, b) => a.k - b.k,
      );
    });
  };
  const style = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        scrollOffset.value,
        tabData.map((u, i) => i * width),
        tabData.map((u, i) => (i === index ? 'white' : '#5d5d5d')),
      ),
    };
  });

  return (
    <Animated.View onLayout={onLayout}>
      <TouchableOpacity activeOpacity={0.6} onPress={() => onItemPress(index)}>
        <Animated.Text
          style={[
            {
              fontWeight: 700,
              fontSize: 16,
              //   color: 'white',
            },
            style,
          ]}>
          {item.title}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Tabs: React.FC<{scrollOffset: any}> = ({scrollOffset, onItemPress}) => {
  const [measures, setMeasures] = useState([]);
  console.log(measures);

  return (
    <Animated.View
      style={{
        paddingVertical: 10,
        width,
      }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
        }}>
        {tabData.map((item, index) => {
          return (
            <Tab
              currentSelectedIndex={1}
              index={index}
              scrollOffset={scrollOffset}
              key={item.key}
              item={item}
              setMeasures={setMeasures}
              onItemPress={onItemPress}
            />
          );
        })}
      </Animated.View>
      {measures.length === tabData.length && (
        <Indicator measures={measures} scrollOffset={scrollOffset} />
      )}
    </Animated.View>
  );
};

const HomeScreen = () => {
  const [search, setSearch] = useState('');
  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollOffset.value = event.contentOffset.x;
    },
  });

  const onItemPress = useCallback(
    (itemIndex: number) => {
      if (aref.current) {
        aref.current.scrollTo({
          x: itemIndex * width,
        });
      }
    },
    [aref],
  );

  return (
    <SafeAreaView style={{display: 'flex'}}>
      <Text
        style={{
          color: 'white',
          fontSize: 40,
          fontWeight: 900,
          textAlign: 'center',
        }}>
        10k Sudokus
      </Text>
      <Animated.View style={{paddingHorizontal: 4, paddingVertical: 14}}>
        <TextInput
          placeholder="Search a number"
          placeholderTextColor="lightgrey"
          inputMode="numeric"
          style={{
            color: 'white',
            backgroundColor: '#1d1d1d',
            paddingHorizontal: 12,
            paddingVertical: 14,
            fontSize: 18,
            borderRadius: 10,
          }}
          onChangeText={(text: string) => setSearch(text)}
        />
      </Animated.View>
      <Tabs scrollOffset={scrollOffset} onItemPress={onItemPress} />
      <View style={{height: 10}} />

      <Animated.ScrollView
        ref={aref}
        onScroll={scrollHandler}
        scrollEventThrottle={10}
        showsHorizontalScrollIndicator={false}
        horizontal
        style={{height: '75%'}}
        snapToAlignment="center"
        snapToInterval={width}
        decelerationRate={0.9}
        // disableIntervalMomentum
        bounces={false}>
        <Animated.View style={{width}}>
          <SudokuList search={search} isComplete={false} />
        </Animated.View>
        <Animated.View style={{width}}>
          <SudokuList search={search} isComplete={true} />
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
