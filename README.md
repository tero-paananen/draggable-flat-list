# draggable-flat-list with example applications for Windows, iOS and Android

React Native FlatList component whose items can be drag into new positions. This component **does NOT use** [React Native Reanimated](https://github.com/software-mansion/react-native-reanimated) or [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler) and that is why this works also on React Native Windows.

Tested on platforms: Windows, iOS, Android

Not tested in production.

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
const App = () => {
  const [data, setData] = useState<MyItem[]>(INITIAL_DATA);

  // Item move done and new item array received
  const handleMove = useCallback(
    (fromIndex: number, toIndex: number, items: Item[]) => {
      setData(items);
    },
    [],
  );

  // Your custom FlatList item
  const MyListItem = React.memo(
    ({item, drag}: {item: MyItem; drag?: (id: string) => void}) => {
      // Long press fires 'drag' to start item dragging
      const handleLongPress = useCallback(() => {
        drag && drag(item.id);
      }, [drag, item.id]);
      return (
        <TouchableOpacity
          onLongPress={handleLongPress}
          style={styles.itemContainer}
          key={item.id}>
          <Text style={[styles.item, {height: item.height}]}>{item.title}</Text>
        </TouchableOpacity>
      );
    },
  );
  const renderItem = useCallback(
    ({item, drag}: {item: MyItem; drag?: (id: string) => void}) => {
      return <MyListItem item={item} drag={drag} />;
    },
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <DraggableFlatList
        style={styles.list}
        data={data}
        renderItem={renderItem}
        onHandleMove={handleMove}
        flyingItemStyle={styles.flying}
      />
      <View style={styles.footer} />
    </View>
  );
};

```


https://user-images.githubusercontent.com/54746036/157134252-e8f17a63-d3cc-41ba-a054-46bc6bb97c3c.mov



![win](https://user-images.githubusercontent.com/54746036/156190545-1d8509ed-6ba7-4d36-a8a4-89fd1b0e4d12.jpg)
