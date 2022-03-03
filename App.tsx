import React, {useCallback, useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import DraggableFlatList, {Item} from './DraggableFlatList';
import {arrayMoveImmutable} from 'array-move';

const ITEM_HEIGHT = 50;
const ITEM_WIDTH = 300;

type MyItem = Item & {
  title?: string;
};

const INITIAL_DATA = Array.from({length: 30}, (_, i) => {
  return {
    id: i + '',
    title: 'Lorem ipsum dolor sit amet ' + i,
    height: ITEM_HEIGHT,
  };
});

const App = () => {
  const [data, setData] = useState<MyItem[]>(INITIAL_DATA);
  const dataRef = useRef<MyItem[] | undefined>(undefined);

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

  const handleSelected = useCallback((item: Item | undefined) => {
    console.log('handleSelected ', {item});
  }, []);

  const handleMove = useCallback((fromIndex: number, toIndex: number) => {
    console.log('handleMove ', {fromIndex, toIndex});
    if (dataRef.current) {
      const newData = arrayMoveImmutable(dataRef.current, fromIndex, toIndex);
      setData(newData);
    }
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <DraggableFlatList
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
