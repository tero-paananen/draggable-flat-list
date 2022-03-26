import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, { DraggableFlatListItem } from './DraggableFlatList';

const ITEM_HEIGHT = 50;
const ITEM_WIDTH = 300;

type MyItem = DraggableFlatListItem & {
  title?: string;
};

const INITIAL_DATA = Array.from({ length: 30 }, (_, i) => {
  return {
    id: i + '',
    title: 'Lorem ipsum dolor sit amet ' + i,
  };
});

const App = () => {
  const [data, setData] = useState<MyItem[]>(INITIAL_DATA);

  // Item move done and new item array received
  const handleMove = useCallback(
    ({ items }: { items: DraggableFlatListItem[] }) => {
      setData(items);
    },
    []
  );

  // Your custom FlatList item
  const MyListItem = React.memo(
    ({ item, move }: { item: MyItem; move: (id: string) => void }) => {
      // Long press fires 'drag' to start item dragging
      const handleLongPress = useCallback(() => {
        move(item.id);
      }, [move, item.id]);
      return (
        <TouchableOpacity
          onLongPress={handleLongPress}
          style={styles.itemContainer}
          key={item.id}
        >
          <Text style={styles.item}>{item.title}</Text>
        </TouchableOpacity>
      );
    }
  );
  const renderItem = useCallback(
    ({ item, move }: { item: MyItem; move: (id: string) => void }) => {
      return <MyListItem item={item} move={move} />;
    },
    [MyListItem]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <DraggableFlatList
        mode={'expands'}
        style={styles.list}
        data={data}
        renderItem={renderItem}
        onMoveEnd={handleMove}
        itemHeight={ITEM_HEIGHT}
        flyingItemStyle={styles.flying}
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
  flying: {
    backgroundColor: 'lightgray',
    opacity: 0.8,
  },
});

export default App;
