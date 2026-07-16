import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '../../src/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View
      style={{
        opacity: focused ? 1 : 0.5,
        transform: [{ scale: focused ? 1.15 : 1 }],
        backgroundColor: focused ? colors.saffron + '33' : 'transparent',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
      }}
    >
      <Text style={{ fontSize: 18 }}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bgElevated,
        },
        headerTintColor: colors.goldBright,
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#100826',
          borderTopColor: colors.violet + '66',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.saffronLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="🪔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => <TabIcon label="📿" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="srs"
        options={{
          title: 'Verses',
          tabBarIcon: ({ focused }) => <TabIcon label="🕉️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon label="📈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <TabIcon label="📓" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
