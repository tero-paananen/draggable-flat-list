import React, {useMemo, useState, useCallback, useRef} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  FlatList,
  Platform,
} from 'react-native';

export type Item = {
  id: string;
  height: number;
};

type FlatListItem = {
  item: InternalItem;
};

type InternalItem = {
  id: string;
  height: number;
  type: string;
  y: number;
  itemId?: number | string;
};

type Layout = {y: number; height: number};

const CustomDraggableFlatList = ({
  data,
  renderItem,
  renderSelectedItem,
  style,
  onSelected,
  onHandleMove,
}: {
  data: Item[];
  renderItem: (itemData: FlatListItem) => JSX.Element;
  renderSelectedItem: (itemData: FlatListItem) => JSX.Element;
  style: any;
  onSelected: (item: Item) => void;
  onHandleMove: (fromIndex: number, toIndex: number) => void;
}) => {
  const [selected, setSelected] = useState<InternalItem | undefined>(undefined);
  const [below, setBelow] = useState<InternalItem | undefined>(undefined);
  const [layout, setLayout] = useState<{layout: Layout | undefined}>({
    layout: undefined,
  });
  const [panning, setPanning] = useState(false);

  const selectedRef = useRef<InternalItem | undefined>(undefined);
  const layoutRef = useRef<Layout | undefined>(undefined);
  const previousOffsetY = useRef(0);
  const scrollOffsetY = useRef(0);
  const flatListRef = useRef<FlatList | null>(null);

  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const moveStartPosYRef = useRef(-1);
  const moveCurrentPosYRef = useRef(-1);

  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = React.useRef(
    // https://reactnative.dev/docs/panresponder
    // https://eveningkid.medium.com/the-basics-of-react-native-gestures-23061b5e89cf
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: () => {
        if (selectedRef.current) {
          // When user has done item selection we start capturing panning
          return true;
        }
        // User can scroll FlatList
        return false;
      },
      //onMoveShouldSetPanResponderCapture: () => true, // iOS: FlatList is not scrollable if true
      onPanResponderGrant: () => {},

      onPanResponderMove: (event: any, gestureState: any) => {
        const {moveX, moveY} = gestureState;
        if (!layoutRef.current) {
          return;
        }
        if (moveStartPosYRef.current === -1) {
          moveStartPosYRef.current = moveY - layoutRef.current.y;
        }
        moveCurrentPosYRef.current = moveY - layoutRef.current.y;
        pan.setValue({x: moveX, y: moveY});
        setPanning(true);
        if (isMovingEnought(moveY)) {
          !scrollTimerRef.current && handleScrollToPosition();
          showWhereToDrop(moveY);
        }
      },

      onPanResponderTerminationRequest: () => true,

      onPanResponderRelease: (event: any, gestureState: any) => {
        const {moveY} = gestureState;
        const releasedOnItem = itemFromTouchPoint(moveY);
        selectedRef.current &&
          releasedOnItem &&
          handleMove(selectedRef.current, releasedOnItem);
        endPanning();
      },

      onPanResponderTerminate: () => {
        endPanning();
      },

      onShouldBlockNativeResponder: () => {
        return true;
      },
    }),
  ).current;

  const handleMove = (sourceItem: InternalItem, targetItem: InternalItem) => {
    if (sourceItem && targetItem) {
      const fromIndex = dataIndexFromItem(sourceItem);
      const toIndex = dataIndexFromItem(targetItem);
      onHandleMove(fromIndex, toIndex);
    }
  };

  const endPanning = () => {
    setSelected(undefined);
    setBelow(undefined);
    pan.setValue({x: 0, y: 0});
    setPanning(false);
    moveStartPosYRef.current = -1;
    moveCurrentPosYRef.current = -1;
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
  };

  const showWhereToDrop = (moveY: number) => {
    const item = itemFromTouchPoint(moveY);
    setBelow(item);
  };

  const itemFromTouchPoint = (moveY: number) => {
    if (!layoutRef.current) {
      return;
    }
    let ret;
    const y = moveY - layoutRef.current.y + scrollOffsetY.current;
    const index = preparedData.findIndex(
      (d: InternalItem) => y > d.y && y < d.y + d.height,
    );
    if (index !== -1) {
      ret = preparedData[index];
    }
    return ret;
  };

  const dataIndexFromItem = (item: InternalItem) => {
    if (item?.type === 'spacer') {
      return data.findIndex(d => d.id === item.itemId);
    } else {
      return data.findIndex(d => d.id === item.id);
    }
  };

  const isMovingEnought = (moveY: number) => {
    const TRESHOLD_PIXELS = 4;
    if (
      selectedRef.current &&
      layoutRef.current &&
      Math.abs(previousOffsetY.current - moveY) > TRESHOLD_PIXELS
    ) {
      previousOffsetY.current = moveY;
      return true;
    }
    return false;
  };

  const handleScrollToPosition = () => {
    // scroll flatlist to up or down
    if (scrollTimerRef.current || !layoutRef.current) {
      return;
    }

    const cancelScrolling = () => {
      scrollTimerRef.current && clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    };

    const userScrollingUp =
      moveStartPosYRef.current > moveCurrentPosYRef.current; // user is panning up or down
    const tresholdTop = layoutRef.current.height * 0.1; // top view area for scrolling up
    const tresholdBottom = layoutRef.current.height * 0.9; // bottom view are for scrolling down
    if (
      moveCurrentPosYRef.current > tresholdTop &&
      moveCurrentPosYRef.current < tresholdBottom
    ) {
      cancelScrolling();
      return;
    }

    const amount = Platform.OS === 'windows' ? 30 : 50;
    const offset = scrollOffsetY.current + (userScrollingUp ? -amount : amount); // amount of scrolling
    flatListRef.current?.scrollToOffset({offset, animated: true}); // scroll

    // scroll again after delayed if user is still panning into same direction
    scrollTimerRef.current = setTimeout(
      () => {
        scrollTimerRef.current = null;
        const userScrollingUpWhenTime =
          moveStartPosYRef.current > moveCurrentPosYRef.current;
        if (userScrollingUp === userScrollingUpWhenTime) {
          handleScrollToPosition();
        } else {
          cancelScrolling();
        }
      },
      Platform.OS === 'windows' ? 30 : 200,
    );
  };

  const preparedData = useMemo(() => {
    const ret: InternalItem[] = [];
    let y = 0;

    data.map(item => {
      const itemHeight = item.height; // default item height
      let spacerHeight = 1; // default spacer height

      if (below?.id === item.id) {
        // Spacer below flying has extra height
        spacerHeight = item.height + spacerHeight;
      }

      // Set spacer
      ret.push({
        type: 'spacer',
        id: item.id + '-spacer',
        itemId: item.id,
        y,
        height: spacerHeight,
      });
      y += spacerHeight;

      // Set item
      ret.push({
        ...item,
        ...{
          type: 'item',
          y,
          height: itemHeight,
        },
      });
      y += itemHeight;
    });

    return ret;
  }, [below?.id, data]);

  selectedRef.current = selected;
  layoutRef.current = layout?.layout;

  const renderFlatListItem = (itemData: FlatListItem) => {
    if (!panning && selected?.id === itemData.item.id) {
      return renderSelectedItem(itemData);
    } else {
      return (
        <CustomItem
          itemData={itemData}
          onSelected={onSelected}
          setSelected={setSelected}>
          {renderItem(itemData)}
        </CustomItem>
      );
    }
  };

  const renderFlyingItem = () => {
    if (selected && panning && layout.layout) {
      return (
        <Animated.View
          style={[
            styles.flying,
            {top: -layout.layout.y * 1.5},
            {transform: [{translateY: pan.y}]},
          ]}>
          {renderItem({item: selected})}
        </Animated.View>
      );
    } else {
      return null;
    }
  };

  const handleLayout = useCallback((e: any) => {
    setLayout({layout: e.nativeEvent.layout});
  }, []);

  const handleScroll = useCallback((e: any) => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const containerStyle = useMemo(() => {
    return {...styles.container, ...style};
  }, [style]);

  return (
    <View
      style={containerStyle}
      {...panResponder.panHandlers}
      onLayout={handleLayout}>
      <Animated.FlatList
        style={styles.list}
        ref={flatListRef}
        keyExtractor={(item: InternalItem) => item.id}
        data={preparedData}
        scrollEnabled={true}
        onScroll={handleScroll}
        renderItem={renderFlatListItem}
      />
      {renderFlyingItem()}
    </View>
  );
};

const CustomItem = ({
  itemData,
  setSelected,
  onSelected,
  children,
}: {
  itemData: FlatListItem;
  setSelected: any;
  onSelected: (item: Item) => void;
  children?: JSX.Element;
}) => {
  const {item} = itemData;

  const handleSelected = useCallback(() => {
    setSelected(item);
    onSelected({id: item.id, height: item.height});
  }, [item, onSelected, setSelected]);

  const spacerStyle = useMemo(() => {
    const backgroundColor =
      item.height > 1
        ? {backgroundColor: 'darkgray'}
        : {backgroundColor: 'transparent'};
    return {...styles.spacer, ...backgroundColor, ...{height: item.height}};
  }, [item]);

  if (item?.type === 'item') {
    return (
      <TouchableWithoutFeedback onPress={handleSelected}>
        {children}
      </TouchableWithoutFeedback>
    );
  } else {
    return <View style={spacerStyle} key={item.id + ''} />;
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  spacer: {
    height: 1,
  },
  flying: {
    position: 'absolute',
    backgroundColor: 'lightgray',
  },
});

export default CustomDraggableFlatList;
