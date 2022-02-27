import React, {useMemo, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import CustomDraggableFlatList, {Item} from './CustomDraggableFlatList';

const ITEM_HEIGHT = 50;
const ITEM_WIDTH = 300;

type MyItem = Item & {
  title?: string;
};

const App = () => {
  const data = useMemo(() => {
    return Array.from({length: 20}, (_, i) => {
      return {
        id: i + '',
        title: 'Lorem ipsum dolor sit amet ' + i,
        height: ITEM_HEIGHT,
      };
    });
  }, []);

  const renderItem = ({item}: {item: MyItem}) => {
    return (
      <View style={styles.itemContainer} key={item.id}>
        <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
      </View>
    );
  };

  const renderSelectedItem = ({item}: {item: MyItem}) => {
    return (
      <View style={styles.selectedItemContainer} key={item.id}>
        <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
      </View>
    );
  };

  const handleSelected = useCallback((item: Item) => {
    console.log('handleSelected ', {item});
  }, []);

  const handleMove = useCallback((fromIndex: number, toIndex: number) => {
    console.log('handleMove ', {fromIndex, toIndex});
    console.log('TODO: move data and set new one into flatlist');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <CustomDraggableFlatList
        style={styles.list}
        data={data}
        renderItem={renderItem}
        renderSelectedItem={renderSelectedItem}
        onSelected={handleSelected}
        onHandleMove={handleMove}
      />
      <View style={styles.footer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#065A95',
  },
  list: {
    height: 600,
    width: ITEM_WIDTH,
    backgroundColor: 'white',
    left: 40,
  },
  itemContainer: {
    justifyContent: 'center',
  },
  selectedItemContainer: {
    justifyContent: 'center',
    backgroundColor: 'lightgray',
  },
  item: {
    paddingTop: 10,
    height: ITEM_HEIGHT,
    width: ITEM_WIDTH,
    textAlign: 'center',
  },
  header: {
    height: 50,
    backgroundColor: '#065A95',
  },
  footer: {
    height: 50,
    backgroundColor: '#065A95',
  },
});

export default App;
