# draggable-flat-list

React Native FlatList component whose items can be drag into new position. This component **does NOT use** [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) or [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) and that is why this works also on React Native Windows.

Tested on platforms: Windows, iOS, (Android will be done)

---

## Development env

```
"typescript": "^4.5.5"
"react": "17.0.2",
"react-native": "^0.65.0",
"react-native-windows": "0.65.8"
```

https://user-images.githubusercontent.com/54746036/155878956-2913dd08-036c-48d7-b2a1-83e2709b55d1.mov

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
```
