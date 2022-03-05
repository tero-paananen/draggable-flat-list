import React, {useCallback, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
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
  const [selected, setSelected] = useState<Item | undefined>(undefined);

  const renderItem = ({item}: {item: MyItem}) => {
    return <MyListItem item={item} />;
  };

  const handleMove = useCallback(
    (fromIndex: number, toIndex: number, items: Item[]) => {
      console.log('handleMove ', {fromIndex, toIndex});
      const newData = arrayMoveImmutable(items, fromIndex, toIndex);
      setSelected(undefined);
      setData(newData);
    },
    [],
  );

  const MyListItem = React.memo(({item}: {item: MyItem}) => {
    const handleSelected = useCallback(() => {
      console.log('selected', {item});
      item.id === selected?.id ? setSelected(undefined) : setSelected(item);
    }, [item]);
    const backgroundColor = item.id === selected?.id ? 'lightgray' : undefined;
    return (
      <TouchableOpacity
        onPress={handleSelected}
        style={[styles.itemContainer, {backgroundColor}]}
        key={item.id}>
        <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
      </TouchableOpacity>
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <DraggableFlatList
        style={styles.list}
        data={data}
        selected={selected}
        renderItem={renderItem}
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
