# draggable-flat-list

React Native FlatList component whose items can be drag into new position. This component **does NOT use** [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) or [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) and that is why this works also on React Native Windows.

Tested on platforms: Windows, iOS, Android

**Windows works currently**, iOS and Android are under development.

---

## Development env

```
"typescript": "^4.5.5"
"react": "17.0.2",
"react-native": "^0.65.0",
"react-native-windows": "0.65.8"
```

## Usage

```
// Your item data
const data = useMemo(() => {
  return Array.from({length: 20}, (_, i) => {
    return {
      id: i + '',
      title: 'Lorem ipsum dolor sit amet ' + i,
      height: ITEM_HEIGHT,
    };
  });
}, []);

// Custom item render function
const renderItem = ({item}: {item: MyItem}) => {
  return (
    <View style={styles.itemContainer} key={item.id}>
      <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
    </View>
  );
};

// Custom selected item render function
const renderSelectedItem = ({item}: {item: MyItem}) => {
  return (
    <View style={styles.selectedItemContainer} key={item.id}>
      <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
    </View>
  );
};

const handleSelected = useCallback((item: Item) => {
}, []);

const handleMove = useCallback((fromIndex: number, toIndex: number) => {
}, []);

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
```



https://user-images.githubusercontent.com/54746036/156192827-a4fc87cd-32c1-41f9-bfa8-b199f69bb0d2.mov



![win](https://user-images.githubusercontent.com/54746036/156190545-1d8509ed-6ba7-4d36-a8a4-89fd1b0e4d12.jpg)


