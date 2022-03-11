import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  FlatList,
  StyleProp,
  ViewStyle,
} from 'react-native';
import debounce from 'lodash/debounce';

import DraggableItem from './DraggableItem';

export type Item = {
  id: string;
  height: number;
};

export type FlatListItem = {
  item: Item;
};

type Layout = { y: number; height: number };
type ItemLayout = { id: string; y: number; height: number };

const CustomDraggableFlatList = ({
  data,
  renderItem,
  style,
  onHandleMove,
  flyingItemStyle,
}: {
  data: Item[];
  renderItem: ({
    item,
    drag,
  }: {
    item: Item;
    drag?: (id: string) => void;
  }) => JSX.Element;
  style: StyleProp<ViewStyle>;
  onHandleMove: (fromIndex: number, toIndex: number, data: Item[]) => void;
  flyingItemStyle: StyleProp<ViewStyle>;
}) => {
  const [below, setBelow] = useState<Item | undefined>(undefined);
  const [selected, setSelected] = useState<Item | undefined>(undefined);
  const [layout, setLayout] = useState<{ layout: Layout | undefined }>({
    layout: undefined,
  });

  const [userPanningDirection, setUserPanningDirection] = useState(0);

  const itemLayoutMapRef = useRef<Map<string, ItemLayout>>(new Map());
  const listItemsRef = useRef<Map<string, React.RefObject<View>>>(new Map());

  const dataRef = useRef<Item[]>([]);
  const panningRef = useRef(false);
  const selectedRef = useRef<Item | undefined>(undefined);
  const belowRef = useRef<Item | undefined>(undefined);
  const layoutRef = useRef<Layout | undefined>(undefined);
  const previousOffsetY = useRef(0);
  const flatListRef = useRef<FlatList | null>(null);

  const pan = useRef(new Animated.ValueXY()).current;
  const prevScrollDirection = useRef(0);
  const scrollToIndex = useRef(-1);
  const startMoveYRef = useRef(-1);
  const currentMoveYRef = useRef(-1);
  const scrollAnimationRunning = useRef(false);
  const scrollOffsetY = useRef(0);

  const SCROLL_ITEM_AMOUNT = 2;
  const SCROLL_DIRECTION_UP = -1;
  const SCROLL_DIRECTION_DOWN = 1;

  // https://reactnative.dev/docs/0.65/flatlist

  const panResponder = React.useRef(
    // https://reactnative.dev/docs/panresponder
    // https://eveningkid.medium.com/the-basics-of-react-native-gestures-23061b5e89cf
    PanResponder.create({
      // Does this view want to become responder on the start of a touch?
      onStartShouldSetPanResponder: () => false,

      // Should child views be prevented from becoming responder on first touch?
      onStartShouldSetPanResponderCapture: (event: any) => {
        const { pageX, pageY } = event.nativeEvent;
        pan.setValue({ x: pageX, y: pageY });

        return false;
      },

      // Called for every touch move on the View when it is not the responder
      // does this view want to "claim" touch responsiveness?
      onMoveShouldSetPanResponder: () => {
        if (panningRef.current && selectedRef.current) {
          // start capturing panning
          return true;
        } else {
          // user can scroll FlatList
          return false;
        }
      },
      // onMoveShouldSetPanResponderCapture: () => true, // iOS: FlatList is not scrollable if true
      onPanResponderGrant: () => {},

      onPanResponderMove: (event: any, gestureState: any) => {
        if (!layoutRef.current) {
          return;
        }
        const { moveX, moveY } = gestureState;
        if (startMoveYRef.current === -1) {
          startMoveYRef.current = moveY;
        }
        currentMoveYRef.current = moveY;

        pan.setValue({ x: moveX, y: moveY });
        panningRef.current = true;

        const prevY = previousOffsetY.current;
        if (isMovingEnought(moveY)) {
          callNextScrollToPoint.current.cancel();
          callNextScrollToPoint.current();
          showWhereToDrop(moveY, dataRef.current);

          const userScrollingUp = currentMoveYRef.current < prevY;
          setUserPanningDirection(
            userScrollingUp ? SCROLL_DIRECTION_UP : SCROLL_DIRECTION_DOWN
          );
        }
      },

      onPanResponderTerminationRequest: () => true,

      onPanResponderRelease: (event: any, gestureState: any) => {
        const { moveY } = gestureState;
        const releasedOnItem = itemFromTouchPoint(moveY, dataRef.current);
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
    })
  ).current;

  const callNextScrollToPoint = useRef(
    debounce(
      () => {
        if (panningRef.current) {
          handleScrollToPoint(currentMoveYRef.current, dataRef.current);
        }
      },
      200,
      { leading: false, trailing: true }
    )
  );

  const handleMove = (sourceItem: Item, targetItem: Item) => {
    if (sourceItem && targetItem) {
      let fromIndex = dataIndexFromItem(sourceItem);
      let toIndex = dataIndexFromItem(targetItem);

      if (fromIndex !== toIndex && fromIndex !== -1 && toIndex !== -1) {
        // positioned on top of target item
        if (fromIndex < toIndex && toIndex > fromIndex + 1) {
          // moving item to down
          toIndex--;
          const newData = moveItem(fromIndex, toIndex, dataRef.current);
          onHandleMove(fromIndex, toIndex, newData);
        } else if (fromIndex > toIndex && fromIndex > toIndex + 1) {
          // moving item to up
          const newData = moveItem(fromIndex, toIndex, dataRef.current);
          onHandleMove(fromIndex, toIndex, newData);
        }
      }
    }
  };

  const endPanning = () => {
    setBelow(undefined);
    setSelected(undefined);
    setUserPanningDirection(0);
    selectedRef.current = undefined;
    pan.setValue({ x: 0, y: 0 });
    panningRef.current = false;
    startMoveYRef.current = -1;
    currentMoveYRef.current = -1;
    scrollToIndex.current = -1;
    prevScrollDirection.current = 0;
    scrollAnimationRunning.current = false;
    callNextScrollToPoint.current.cancel();
  };

  const drag = (id: string) => {
    const index = dataRef.current.findIndex(d => d.id === id);
    const item = index !== -1 ? dataRef.current[index] : undefined;
    if (item) {
      panningRef.current = true;
      setSelected(item);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number, items: Item[]) => {
    const mutable = [...items];
    const item = mutable.splice(fromIndex, 1)[0];
    mutable.splice(toIndex, 0, item);
    return mutable;
  };

  const showWhereToDrop = (moveY: number, items: Item[]) => {
    const item = itemFromTouchPoint(moveY, items);
    setBelow(item);
  };

  const posFromPanResponderY = (moveY: number) => {
    return moveY - (layoutRef.current?.y || 0) + scrollOffsetY.current;
  };

  const itemFromTouchPoint = (moveY: number, items: Item[]) => {
    if (!layoutRef.current || !itemLayoutMapRef.current || items.length === 0) {
      return;
    }
    const index = itemIndexFromTouchPoint(moveY, items);
    return index !== -1 ? items[index] : undefined;
  };

  const itemIndexFromTouchPoint = (moveY: number, items: Item[]) => {
    const y = posFromPanResponderY(moveY);
    const index = items.findIndex((d: Item) => {
      const itemLayout = itemLayoutMapRef.current.get(d.id);
      if (!itemLayout || !layoutRef.current) {
        return false;
      }
      const itemY = itemLayout.y - layoutRef.current.y + scrollOffsetY.current;
      return itemLayout && y > itemY && y < itemY + itemLayout.height;
    });
    return index;
  };

  const dataIndexFromItem = (item: Item) => {
    return dataRef.current.findIndex(d => d.id === item.id);
  };

  const isMovingEnought = (moveY: number) => {
    const TRESHOLD_PIXELS = 10;
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

  const handleScrollToPoint = (moveY: number, items: Item[]) => {
    const cancel = () => {
      callNextScrollToPoint.current.cancel();
    };

    // scroll flatlist to up or down
    if (!panningRef.current || !layoutRef.current?.y) {
      cancel();
      return;
    }

    const yPosInLayout = moveY - layoutRef.current.y;
    const userScrollingUp = startMoveYRef.current > currentMoveYRef.current; // user is panning up or down
    const tresholdTop = layoutRef.current.height * 0.1; // top view area for scrolling up
    const tresholdBottom = layoutRef.current.height * 0.9; // bottom view are for scrolling down

    if (yPosInLayout > tresholdTop && yPosInLayout < tresholdBottom) {
      // No scrolling
      cancel();
      return;
    }

    // get current index and index where to scroll next - to up or down
    const index = itemIndexFromTouchPoint(moveY, items);
    if (index === -1) {
      cancel();
      return;
    }

    if (scrollToIndex.current === -1) {
      scrollToIndex.current = index;
    }

    if (
      (userScrollingUp &&
        prevScrollDirection.current !== SCROLL_DIRECTION_UP) ||
      (!userScrollingUp &&
        prevScrollDirection.current !== SCROLL_DIRECTION_DOWN)
    ) {
      // scroll direction change
      scrollToIndex.current = index;
    }

    let viewPosition;
    if (userScrollingUp) {
      // scrolling to up
      prevScrollDirection.current = SCROLL_DIRECTION_UP;
      scrollToIndex.current = scrollToIndex.current - SCROLL_ITEM_AMOUNT;
      viewPosition = 0;
    } else {
      // scrolling to down
      prevScrollDirection.current = SCROLL_DIRECTION_DOWN;
      scrollToIndex.current = scrollToIndex.current + SCROLL_ITEM_AMOUNT;
      viewPosition = 1;
    }

    if (scrollToIndex.current < 0 || scrollToIndex.current > data.length - 1) {
      cancel();
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: scrollToIndex.current,
      viewPosition,
      animated: true,
    });

    callNextScrollToPoint.current();
  };

  useEffect(() => {
    dataRef.current = data;
    selectedRef.current = selected;
    layoutRef.current = layout?.layout;
    belowRef.current = below;

    const measureItems = () => {
      // measure all item refs positions
      for (const id of listItemsRef.current.keys()) {
        const ref = listItemsRef.current.get(id);
        if (ref) {
          measureRef(ref, id);
        }
      }
    };
    measureItems();
  }, [below, data, layout?.layout, selected]);

  const measureRef = (ref: React.RefObject<View>, id: string) => {
    ref.current?.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        itemLayoutMapRef.current.set(id, {
          id,
          y,
          height,
        });
      }
    );
  };

  const renderFlatListItem = useCallback(
    (itemData: FlatListItem) => {
      const setRef = (ref: React.RefObject<View>) => {
        // store item ref
        listItemsRef.current.set(itemData.item.id, ref);
        // and measure item position
        measureRef(ref, itemData.item.id);
      };

      return (
        <DraggableItem
          itemData={itemData}
          setRef={setRef}
          below={below?.id}
          userIsScrollingUp={userPanningDirection === SCROLL_DIRECTION_UP}
        >
          {renderItem({
            item: itemData.item,
            drag: drag,
          })}
        </DraggableItem>
      );
    },
    [SCROLL_DIRECTION_UP, below?.id, renderItem, userPanningDirection]
  );

  const renderFlyingItem = useCallback(() => {
    if (selected && panningRef.current && layout.layout) {
      return (
        <Animated.View
          style={[
            styles.flying,
            flyingItemStyle,
            { top: -layout.layout.y * 1.5 },
            { transform: [{ translateY: pan.y }] },
          ]}
        >
          {renderItem({ item: selected })}
        </Animated.View>
      );
    } else {
      return null;
    }
  }, [flyingItemStyle, layout.layout, pan.y, renderItem, selected]);

  const handleLayout = useCallback((e: any) => {
    setLayout({ layout: e.nativeEvent.layout });
  }, []);

  const handleScroll = useCallback((e: any) => {
    scrollOffsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const containerStyle = useMemo(() => {
    return [{ ...styles.container }, style];
  }, [style]);

  const extraData = useMemo(() => {
    return { below, selected };
  }, [below, selected]);

  return (
    <View
      style={containerStyle}
      {...panResponder.panHandlers}
      onLayout={handleLayout}
    >
      <FlatList
        style={styles.list}
        ref={flatListRef}
        keyExtractor={(item: Item) => item.id}
        data={data}
        extraData={extraData}
        scrollEnabled={true}
        initialNumToRender={data.length}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        renderItem={renderFlatListItem}
      />
      {renderFlyingItem()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  flying: {
    position: 'absolute',
  },
});

export default CustomDraggableFlatList;
